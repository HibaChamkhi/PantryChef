import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';

import { DISHES, type DishText as SimulatedDishText } from '@/lib/content.i18n';
import { currentLocale, languageName, t } from '@/lib/i18n';
import { createId } from '@/lib/utils';
import { AiError, RecipeOutput, describePantry, describePreferences, getClient, hasApiKey, toAiError, toRecipe } from '@/services/ai';
import { DEFAULT_PREFERENCES } from '@/services/localChef';
import type { PhotoInput } from '@/services/vision';
import type { DishIdentification, DishScanResult, InventoryItem, Recipe, RecipePreferences } from '@/types';

/**
 * Dish scan: identify a cooked meal from a photo and produce recipes for it.
 * Uses Claude vision when an API key is configured, otherwise a deterministic
 * simulation so the flow works offline.
 */

const MODEL = process.env.EXPO_PUBLIC_CLAUDE_MODEL?.trim() || 'claude-opus-5';
const SIMULATION_DELAY_MS = 2000;

/* ------------------------------ Pantry matching ----------------------------- */

function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z ]/g, '').replace(/s\b/g, '').trim();
}

/** Marks recipe ingredients that match something in the pantry by name. */
export function markPantryMatches(recipes: Recipe[], pantry: InventoryItem[]): Recipe[] {
  const names = pantry.map((item) => normalise(item.name)).filter(Boolean);
  const inPantry = (ingredient: string) => {
    const target = normalise(ingredient);
    return names.some((name) => target.includes(name) || name.includes(target));
  };
  return recipes.map((recipe) => ({
    ...recipe,
    ingredients: recipe.ingredients.map((ingredient) => ({
      ...ingredient,
      inPantry: ingredient.inPantry || inPantry(ingredient.name),
    })),
  }));
}

/** Pantry items that this recipe's ingredients refer to. */
export function matchPantryItems(recipe: Recipe, pantry: InventoryItem[]): InventoryItem[] {
  const targets = recipe.ingredients.map((ingredient) => normalise(ingredient.name)).filter(Boolean);
  return pantry.filter((item) => {
    const name = normalise(item.name);
    return name.length > 0 && targets.some((target) => target.includes(name) || name.includes(target));
  });
}

/* -------------------------------- Simulation -------------------------------- */

function localisedDishes(): SimulatedDishText[] {
  return DISHES[currentLocale()] ?? DISHES.en;
}

function hash(input: string): number {
  let value = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    value ^= input.charCodeAt(i);
    value = Math.imul(value, 16777619) >>> 0;
  }
  return value;
}

const SIMULATED_TIMERS: number[][] = [
  [8, 3, 45, 25, 20, 0],
  [0, 8, 1, 10, 6, 0],
  [9, 5, 0, 0, 0, 0],
  [0, 15, 8, 10, 8, 3],
  [0, 30, 0, 0, 12, 0],
  [10, 0, 0, 0, 0],
  [8, 0, 3, 0, 3, 0],
];
const SIMULATED_META: Array<{ emoji: string; prep: number; cook: number; servings: number; difficulty: Recipe['difficulty'] }> = [
  { emoji: '🍲', prep: 25, cook: 90, servings: 6, difficulty: 'medium' },
  { emoji: '🍳', prep: 10, cook: 25, servings: 2, difficulty: 'easy' },
  { emoji: '🍝', prep: 5, cook: 15, servings: 2, difficulty: 'medium' },
  { emoji: '🍛', prep: 15, cook: 30, servings: 4, difficulty: 'medium' },
  { emoji: '🍕', prep: 20, cook: 12, servings: 2, difficulty: 'medium' },
  { emoji: '🥗', prep: 15, cook: 10, servings: 2, difficulty: 'easy' },
  { emoji: '🍜', prep: 15, cook: 10, servings: 2, difficulty: 'medium' },
];

function simulateDish(photoUri: string, seed: string, pantry: InventoryItem[]): DishScanResult {
  const dishes = localisedDishes();
  const index = hash(seed) % dishes.length;
  const text = dishes[index];
  const meta = SIMULATED_META[index];
  const timers = SIMULATED_TIMERS[index];
  const recipe: Recipe = {
    id: createId(),
    title: text.title,
    description: text.recipeDescription,
    emoji: meta.emoji,
    prepMinutes: meta.prep,
    cookMinutes: meta.cook,
    servings: meta.servings,
    difficulty: meta.difficulty,
    ingredients: text.ingredients.map(([name, amount]) => ({ name, amount, inPantry: false })),
    steps: text.steps.map((instruction, position) => ({
      order: position + 1,
      instruction,
      ...(timers[position] ? { durationMinutes: timers[position] } : {}),
    })),
    createdAt: new Date().toISOString(),
  };
  return {
    photoUri,
    dish: {
      name: text.name,
      cuisine: text.cuisine,
      description: text.description,
      confidence: 0.86 + ((hash(seed) >>> 4) % 10) / 100,
      keyIngredients: text.keyIngredients,
    },
    recipes: markPantryMatches([recipe], pantry),
    simulated: true,
  };
}

/* ---------------------------------- Claude ---------------------------------- */

const DishOutput = z.object({
  dish: z.object({
    name: z.string(),
    cuisine: z.string(),
    description: z.string(),
    confidence: z.number(),
    keyIngredients: z.array(z.string()),
  }),
  recipes: z.array(RecipeOutput),
});

const SYSTEM_PROMPT = `You are PantryChef, a practical home cook. The user photographed a dish they ate or saw.
1. Identify the dish as specifically as you can (name, cuisine, one or two sentence description, confidence 0-1, key ingredients).
2. Write two recipes to make it at home: first the classic version, then a quicker or pantry-friendly version that leans on the user's pantry list when possible.
Recipe rules: 4 to 12 ingredients each; set inPantry=true only for ingredients present in the pantry list; 4 to 8 beginner-friendly steps; durationMinutes only where a timer helps, null otherwise; one food emoji per recipe.
If the photo does not show food, set the dish name to "Not a dish", confidence 0, and return no recipes.`;

function languageInstruction(): string {
  return `Write the dish name, cuisine, description, key ingredients and every recipe string in ${languageName()}.`;
}

async function identifyWithClaude(photo: PhotoInput, pantry: InventoryItem[], prefs: RecipePreferences, signal?: AbortSignal): Promise<DishScanResult> {
  if (!photo.base64) throw new AiError(t('errors.photoUnreadable'), false);
  const mediaType = photo.mimeType === 'image/png' ? 'image/png' : photo.mimeType === 'image/webp' ? 'image/webp' : 'image/jpeg';

  const pantryText = pantry.length > 0 ? `The user's pantry:\n${describePantry(pantry)}` : 'The user has not listed any pantry items.';

  const response = await getClient().messages.parse(
    {
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      output_config: { format: zodOutputFormat(DishOutput), effort: 'medium' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: photo.base64 } },
            { type: 'text', text: `${pantryText}\n\n${describePreferences(prefs)}\n${languageInstruction()}\n\nWhat dish is this, and how do I make it?` },
          ],
        },
      ],
    },
    { signal },
  );

  if (response.stop_reason === 'refusal') {
    throw new AiError(t('errors.photoDeclined'), false);
  }
  const parsed = response.parsed_output;
  if (!parsed) throw new AiError(t('errors.unreadable'));

  const dish: DishIdentification = {
    name: parsed.dish.name.trim() || 'Unknown dish',
    cuisine: parsed.dish.cuisine.trim(),
    description: parsed.dish.description.trim(),
    confidence: Math.min(1, Math.max(0, parsed.dish.confidence)),
    keyIngredients: parsed.dish.keyIngredients.map((item) => item.trim()).filter(Boolean).slice(0, 8),
  };
  const recipes = markPantryMatches(parsed.recipes.map(toRecipe).filter((recipe) => recipe.steps.length > 0), pantry);
  return { photoUri: photo.uri, dish, recipes, simulated: false };
}

/* ---------------------------------- Public ---------------------------------- */

export async function identifyDish(
  photo: PhotoInput,
  pantry: InventoryItem[],
  options: { signal?: AbortSignal; preferences?: RecipePreferences } = {},
): Promise<DishScanResult> {
  if (hasApiKey()) {
    try {
      return await identifyWithClaude(photo, pantry, options.preferences ?? DEFAULT_PREFERENCES, options.signal);
    } catch (error) {
      if (error instanceof Anthropic.APIError || error instanceof AiError) throw toAiError(error);
      throw new AiError(t('errors.dishFailed'));
    }
  }

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, SIMULATION_DELAY_MS);
    options.signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new AiError(t('errors.cancelled'), false));
    });
  });
  return simulateDish(photo.uri, photo.assetId ?? photo.uri, pantry);
}
