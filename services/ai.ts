import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';

import { languageName, t } from '@/lib/i18n';
import { createId } from '@/lib/utils';
import { DEFAULT_PREFERENCES, generateLocalRecipes } from '@/services/localChef';
import type { InventoryItem, Recipe, RecipePreferences } from '@/types';

/**
 * Reads the API key inlined at build time by Expo. Leaving it unset switches
 * the app to the offline chef, so the feature never hard-fails.
 *
 * SECURITY: an EXPO_PUBLIC_ key ships inside the app bundle and can be
 * extracted by anyone with the binary. This is acceptable for personal use
 * and development; for a public release, route requests through your own
 * backend that holds the key.
 */
const RAW_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY?.trim() || '';
/** Only accept keys that look real; placeholders such as "sk-ant-PASTE-YOUR-KEY" fall back to the offline chef. */
const API_KEY = /^sk-ant-[A-Za-z0-9_-]{30,}$/.test(RAW_API_KEY) && !/PASTE|YOUR[-_]KEY|XXXX/i.test(RAW_API_KEY) ? RAW_API_KEY : undefined;
const MODEL = process.env.EXPO_PUBLIC_CLAUDE_MODEL?.trim() || 'claude-opus-5';
const REQUEST_TIMEOUT_MS = 90_000;
const LOCAL_CHEF_DELAY_MS = 1200;

export type RecipeSource = 'claude' | 'local';

export function hasApiKey(): boolean {
  return API_KEY !== undefined;
}

export function recipeSource(): RecipeSource {
  return hasApiKey() ? 'claude' : 'local';
}

export class AiError extends Error {
  readonly retryable: boolean;

  constructor(message: string, retryable = true) {
    super(message);
    this.name = 'AiError';
    this.retryable = retryable;
  }
}

let client: Anthropic | null = null;

export function getClient(): Anthropic {
  if (!API_KEY) {
    throw new AiError(t('errors.noKey'), false);
  }
  if (!client) {
    client = new Anthropic({ apiKey: API_KEY, timeout: REQUEST_TIMEOUT_MS, maxRetries: 2 });
  }
  return client;
}

// Structured output schema. Structured outputs require every field, so
// optional values are modelled as nullable and normalised afterwards.
export const RecipeOutput = z.object({
  title: z.string(),
  description: z.string(),
  emoji: z.string(),
  prepMinutes: z.number(),
  cookMinutes: z.number(),
  servings: z.number(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  ingredients: z.array(
    z.object({
      name: z.string(),
      amount: z.string(),
      inPantry: z.boolean(),
    }),
  ),
  steps: z.array(
    z.object({
      instruction: z.string(),
      durationMinutes: z.number().nullable(),
    }),
  ),
});

const RecipesOutput = z.object({
  recipes: z.array(RecipeOutput),
});

export type RecipeOutputType = z.infer<typeof RecipeOutput>;

const SYSTEM_PROMPT = `You are PantryChef, a practical home cook who helps people reduce food waste.
Given a list of ingredients someone already has, propose exactly three distinct, realistic recipes that use as many of those ingredients as possible.
Rules:
- Prioritise ingredients marked as expiring soon.
- Assume basic staples (salt, pepper, oil, water) are available; list them with inPantry=false if they are not in the pantry list.
- Each recipe needs 4 to 10 ingredients and 4 to 8 clear, numbered-in-order steps written for a beginner.
- Set durationMinutes only on steps where a timer genuinely helps (simmering, baking, resting, marinating). Use null otherwise.
- Use a single food emoji per recipe. Keep descriptions to one or two sentences.
- Vary the three recipes in style (for example one quick, one comforting, one light).`;

function clampInt(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function toRecipe(output: RecipeOutputType): Recipe {
  return {
    id: createId(),
    title: output.title.trim() || 'Untitled recipe',
    description: output.description.trim(),
    emoji: output.emoji.trim() || '🍽️',
    prepMinutes: clampInt(output.prepMinutes, 0, 240, 10),
    cookMinutes: clampInt(output.cookMinutes, 0, 480, 20),
    servings: clampInt(output.servings, 1, 12, 2),
    difficulty: output.difficulty,
    ingredients: output.ingredients
      .filter((ingredient) => ingredient.name.trim())
      .map((ingredient) => ({
        name: ingredient.name.trim(),
        amount: ingredient.amount.trim(),
        inPantry: ingredient.inPantry,
      })),
    steps: output.steps
      .filter((step) => step.instruction.trim())
      .map((step, index) => ({
        order: index + 1,
        instruction: step.instruction.trim(),
        ...(step.durationMinutes && step.durationMinutes > 0
          ? { durationMinutes: clampInt(step.durationMinutes, 1, 480, 5) }
          : {}),
      })),
    createdAt: new Date().toISOString(),
  };
}

export function describePantry(items: InventoryItem[]): string {
  const today = new Date();
  return items
    .map((item) => {
      let line = `- ${item.name}: ${item.quantity} ${item.unit}`;
      if (item.expiresAt) {
        const days = Math.round((new Date(item.expiresAt).getTime() - today.getTime()) / 86_400_000);
        if (days <= 3) line += ' (EXPIRING SOON)';
      }
      return line;
    })
    .join('\n');
}

const DIET_TEXT: Record<string, string> = {
  none: '',
  vegetarian: 'vegetarian (no meat or fish)',
  vegan: 'vegan (no animal products at all)',
  pescatarian: 'pescatarian (fish is fine, no other meat)',
  halal: 'halal (no pork, no alcohol)',
  kosher: 'kosher (no pork, no shellfish, no mixing meat and dairy)',
  glutenFree: 'gluten free',
};

/** Human-readable constraints block shared by every generator prompt. */
export function describePreferences(prefs: RecipePreferences): string {
  const lines: string[] = [];
  if (prefs.diet !== 'none') lines.push(`Diet: ${DIET_TEXT[prefs.diet] ?? prefs.diet}. Every recipe must comply.`);
  if (prefs.avoid.length > 0) lines.push(`Never use these ingredients or anything containing them: ${prefs.avoid.join(', ')}.`);
  if (prefs.cuisine !== 'any') lines.push(`Preferred cuisine: ${prefs.cuisine}.`);
  if (prefs.maxMinutes) lines.push(`Each recipe must take at most ${prefs.maxMinutes} minutes of prep plus cooking.`);
  const language = `Write every user-facing string (titles, descriptions, ingredient names, amounts, steps) in ${languageName()}.`;
  const constraints = lines.length > 0 ? `Constraints:\n${lines.map((line) => `- ${line}`).join('\n')}` : 'No dietary constraints.';
  return `${language}\n${constraints}`;
}

export function toAiError(error: unknown): AiError {
  if (error instanceof AiError) return error;
  if (error instanceof Anthropic.AuthenticationError) {
    return new AiError(t('errors.keyRejected'), false);
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new AiError(t('errors.busy'));
  }
  if (error instanceof Anthropic.BadRequestError) {
    return new AiError(t('errors.badRequest', { message: error.message }), false);
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return new AiError(t('errors.offline'));
  }
  if (error instanceof Anthropic.APIError) {
    return new AiError(t('errors.apiError', { status: String(error.status ?? '?') }));
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return new AiError(t('errors.cancelled'), false);
  }
  return new AiError(t('errors.generic'));
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new AiError(t('errors.cancelled'), false));
    });
  });
}

/**
 * Generates three recipes for the given pantry. Uses Claude when an API key is
 * configured, otherwise the deterministic offline chef.
 */
export async function generateRecipes(
  items: InventoryItem[],
  options: { signal?: AbortSignal; preferences?: RecipePreferences } = {},
): Promise<Recipe[]> {
  const prefs = options.preferences ?? DEFAULT_PREFERENCES;
  if (items.length === 0) {
    throw new AiError(t('errors.emptyPantry'), false);
  }

  if (!hasApiKey()) {
    await sleep(LOCAL_CHEF_DELAY_MS, options.signal);
    return generateLocalRecipes(items, prefs);
  }

  try {
    const response = await getClient().messages.parse(
      {
        model: MODEL,
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        output_config: {
          format: zodOutputFormat(RecipesOutput),
          effort: 'medium',
        },
        messages: [
          {
            role: 'user',
            content: `Here is what I have in my pantry today:\n${describePantry(items)}\n\n${describePreferences(prefs)}\n\nSuggest three recipes.`,
          },
        ],
      },
      { signal: options.signal },
    );

    if (response.stop_reason === 'refusal') {
      throw new AiError(t('errors.declined'), false);
    }
    if (response.stop_reason === 'max_tokens') {
      throw new AiError(t('errors.incomplete'));
    }

    const parsed = response.parsed_output;
    if (!parsed || parsed.recipes.length === 0) {
      throw new AiError(t('errors.unreadable'));
    }

    const recipes = parsed.recipes.map(toRecipe).filter((recipe) => recipe.steps.length > 0);
    if (recipes.length === 0) {
      throw new AiError(t('errors.noSteps'));
    }
    return recipes.slice(0, 3);
  } catch (error) {
    throw toAiError(error);
  }
}
