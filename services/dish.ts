import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';

import { createId } from '@/lib/utils';
import { AiError, RecipeOutput, describePantry, describePreferences, getClient, hasApiKey, toAiError, toRecipe } from '@/services/ai';
import { DEFAULT_PREFERENCES } from '@/services/localChef';
import type { PhotoInput } from '@/services/vision';
import type { DishIdentification, DishScanResult, InventoryItem, Recipe, RecipePreferences, RecipeStep } from '@/types';

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

function steps(list: Array<[string, number?]>): RecipeStep[] {
  return list.map(([instruction, durationMinutes], index) => ({
    order: index + 1,
    instruction,
    ...(durationMinutes ? { durationMinutes } : {}),
  }));
}

type SimulatedDish = { dish: DishIdentification; recipe: Omit<Recipe, 'id' | 'createdAt'> };

const SIMULATED_DISHES: SimulatedDish[] = [
  {
    dish: {
      name: 'Couscous with lamb and vegetables',
      cuisine: 'Tunisian',
      description: 'Steamed semolina couscous topped with slow-cooked lamb, carrots, potatoes, courgettes and chickpeas in a spiced red broth.',
      confidence: 0.92,
      keyIngredients: ['Couscous', 'Lamb', 'Carrots', 'Chickpeas', 'Tomato paste', 'Harissa'],
    },
    recipe: {
      title: 'Tunisian couscous with lamb',
      description: 'The Sunday classic: lamb simmered in a tomato and harissa broth with vegetables, spooned over fluffy couscous.',
      emoji: '🍲',
      prepMinutes: 25,
      cookMinutes: 90,
      servings: 6,
      difficulty: 'medium',
      ingredients: [
        { name: 'Couscous', amount: '500 g', inPantry: false },
        { name: 'Lamb shoulder', amount: '800 g', inPantry: false },
        { name: 'Onion', amount: '1', inPantry: false },
        { name: 'Tomato paste', amount: '2 tbsp', inPantry: false },
        { name: 'Harissa', amount: '1 tbsp', inPantry: false },
        { name: 'Carrots', amount: '3', inPantry: false },
        { name: 'Potatoes', amount: '3', inPantry: false },
        { name: 'Courgette', amount: '2', inPantry: false },
        { name: 'Chickpeas', amount: '1 can', inPantry: false },
        { name: 'Olive oil', amount: '3 tbsp', inPantry: false },
        { name: 'Coriander seeds', amount: '1 tsp', inPantry: false },
        { name: 'Green chillies', amount: '2', inPantry: false },
      ],
      steps: steps([
        ['Brown the lamb pieces with the chopped onion in olive oil in a large pot.', 8],
        ['Stir in the tomato paste, harissa, and coriander seeds and cook until dark and fragrant.', 3],
        ['Cover with water, bring to a simmer, and cook the lamb until tender.', 45],
        ['Add the carrots and potatoes and simmer, then the courgettes and chickpeas.', 25],
        ['Meanwhile moisten the couscous, steam it over the broth, and fluff it with a little oil.', 20],
        ['Pile the couscous on a platter, arrange the meat and vegetables on top, and ladle over the broth. Serve the chillies alongside.'],
      ]),
    },
  },
  {
    dish: {
      name: 'Shakshuka',
      cuisine: 'Middle Eastern',
      description: 'Eggs poached in a spiced tomato and pepper sauce, usually served straight from the pan with bread.',
      confidence: 0.93,
      keyIngredients: ['Eggs', 'Tomatoes', 'Bell pepper', 'Onion', 'Cumin', 'Paprika'],
    },
    recipe: {
      title: 'Classic shakshuka',
      description: 'A one-pan brunch or dinner: a rich tomato base, softly set eggs, and plenty of bread for dipping.',
      emoji: '🍳',
      prepMinutes: 10,
      cookMinutes: 25,
      servings: 2,
      difficulty: 'easy',
      ingredients: [
        { name: 'Eggs', amount: '4', inPantry: false },
        { name: 'Canned tomatoes', amount: '400 g', inPantry: false },
        { name: 'Bell pepper', amount: '1', inPantry: false },
        { name: 'Onion', amount: '1', inPantry: false },
        { name: 'Garlic', amount: '2 cloves', inPantry: false },
        { name: 'Cumin', amount: '1 tsp', inPantry: false },
        { name: 'Smoked paprika', amount: '1 tsp', inPantry: false },
        { name: 'Olive oil', amount: '2 tbsp', inPantry: false },
        { name: 'Bread', amount: 'to serve', inPantry: false },
      ],
      steps: steps([
        ['Dice the onion and pepper and thinly slice the garlic.'],
        ['Soften the onion and pepper in olive oil over medium heat.', 8],
        ['Add the garlic, cumin, and paprika and stir until fragrant.', 1],
        ['Pour in the tomatoes, season, and simmer until thick.', 10],
        ['Make four wells, crack an egg into each, cover, and cook until the whites set.', 6],
        ['Serve from the pan with warm bread.'],
      ]),
    },
  },
  {
    dish: {
      name: 'Spaghetti carbonara',
      cuisine: 'Italian',
      description: 'Pasta coated in a silky sauce of eggs, hard cheese, and cured pork, with black pepper.',
      confidence: 0.91,
      keyIngredients: ['Spaghetti', 'Eggs', 'Parmesan', 'Bacon', 'Black pepper'],
    },
    recipe: {
      title: 'Spaghetti carbonara',
      description: 'No cream needed: the heat of the pasta turns eggs and cheese into a glossy sauce.',
      emoji: '🍝',
      prepMinutes: 5,
      cookMinutes: 15,
      servings: 2,
      difficulty: 'medium',
      ingredients: [
        { name: 'Spaghetti', amount: '200 g', inPantry: false },
        { name: 'Bacon', amount: '100 g', inPantry: false },
        { name: 'Eggs', amount: '2', inPantry: false },
        { name: 'Parmesan', amount: '50 g', inPantry: false },
        { name: 'Black pepper', amount: '1 tsp', inPantry: false },
        { name: 'Salt', amount: 'for the water', inPantry: false },
      ],
      steps: steps([
        ['Bring a large pot of salted water to the boil and cook the spaghetti until al dente.', 9],
        ['Meanwhile fry the bacon until crisp, then take the pan off the heat.', 5],
        ['Whisk the eggs with the grated parmesan and lots of black pepper.'],
        ['Drain the pasta, keeping a cup of cooking water, and toss it into the bacon pan.'],
        ['Off the heat, pour in the egg mixture and toss fast, adding pasta water until glossy.'],
        ['Serve immediately with extra cheese and pepper.'],
      ]),
    },
  },
  {
    dish: {
      name: 'Chicken tikka masala',
      cuisine: 'Indian-British',
      description: 'Marinated chicken pieces in a creamy, spiced tomato sauce, served with rice or naan.',
      confidence: 0.88,
      keyIngredients: ['Chicken', 'Yogurt', 'Tomatoes', 'Garam masala', 'Cream', 'Ginger'],
    },
    recipe: {
      title: 'Chicken tikka masala',
      description: 'A weeknight version: yogurt-marinated chicken finished in a fragrant tomato and cream sauce.',
      emoji: '🍛',
      prepMinutes: 15,
      cookMinutes: 30,
      servings: 4,
      difficulty: 'medium',
      ingredients: [
        { name: 'Chicken thighs', amount: '600 g', inPantry: false },
        { name: 'Greek yogurt', amount: '150 g', inPantry: false },
        { name: 'Garam masala', amount: '2 tsp', inPantry: false },
        { name: 'Ginger', amount: '1 thumb', inPantry: false },
        { name: 'Garlic', amount: '3 cloves', inPantry: false },
        { name: 'Onion', amount: '1', inPantry: false },
        { name: 'Canned tomatoes', amount: '400 g', inPantry: false },
        { name: 'Cream', amount: '100 ml', inPantry: false },
        { name: 'Basmati rice', amount: 'to serve', inPantry: false },
      ],
      steps: steps([
        ['Cut the chicken into chunks and mix with the yogurt, half the garam masala, grated ginger, and garlic.'],
        ['Let it marinate while you prepare the sauce.', 15],
        ['Fry the onion until golden, then add the remaining spices.', 8],
        ['Add the tomatoes and simmer until thick.', 10],
        ['Grill or pan-fry the chicken until charred at the edges.', 8],
        ['Stir the chicken and cream into the sauce and warm through. Serve with rice.', 3],
      ]),
    },
  },
  {
    dish: {
      name: 'Margherita pizza',
      cuisine: 'Italian',
      description: 'Thin crust with tomato sauce, mozzarella, and fresh basil.',
      confidence: 0.95,
      keyIngredients: ['Flour', 'Tomatoes', 'Mozzarella', 'Basil', 'Olive oil'],
    },
    recipe: {
      title: 'Quick margherita pizza',
      description: 'A no-knead dough that rests while the oven heats, topped simply and baked hot.',
      emoji: '🍕',
      prepMinutes: 20,
      cookMinutes: 12,
      servings: 2,
      difficulty: 'medium',
      ingredients: [
        { name: 'Flour', amount: '300 g', inPantry: false },
        { name: 'Yeast', amount: '1 tsp', inPantry: false },
        { name: 'Water', amount: '200 ml', inPantry: false },
        { name: 'Canned tomatoes', amount: '200 g', inPantry: false },
        { name: 'Mozzarella', amount: '150 g', inPantry: false },
        { name: 'Basil', amount: 'a handful', inPantry: false },
        { name: 'Olive oil', amount: '2 tbsp', inPantry: false },
      ],
      steps: steps([
        ['Mix the flour, yeast, a pinch of salt, and water into a shaggy dough.'],
        ['Cover and let the dough rest while the oven heats to its highest setting.', 30],
        ['Crush the tomatoes with salt and a little olive oil for the sauce.'],
        ['Stretch the dough thin on a floured tray and spread the sauce over it.'],
        ['Tear over the mozzarella and bake until the crust is blistered.', 12],
        ['Finish with basil leaves and a drizzle of oil.'],
      ]),
    },
  },
  {
    dish: {
      name: 'Caesar salad',
      cuisine: 'American',
      description: 'Crisp romaine with a creamy garlic and anchovy dressing, croutons, and parmesan.',
      confidence: 0.9,
      keyIngredients: ['Lettuce', 'Parmesan', 'Bread', 'Eggs', 'Garlic', 'Lemon'],
    },
    recipe: {
      title: 'Caesar salad with crunchy croutons',
      description: 'A proper dressing made from scratch, plus golden croutons from leftover bread.',
      emoji: '🥗',
      prepMinutes: 15,
      cookMinutes: 10,
      servings: 2,
      difficulty: 'easy',
      ingredients: [
        { name: 'Lettuce', amount: '1 head', inPantry: false },
        { name: 'Bread', amount: '2 slices', inPantry: false },
        { name: 'Parmesan', amount: '40 g', inPantry: false },
        { name: 'Egg yolk', amount: '1', inPantry: false },
        { name: 'Garlic', amount: '1 clove', inPantry: false },
        { name: 'Lemon', amount: '1/2', inPantry: false },
        { name: 'Olive oil', amount: '4 tbsp', inPantry: false },
        { name: 'Anchovies', amount: '2 fillets', inPantry: false },
      ],
      steps: steps([
        ['Tear the bread into chunks, toss with oil, and toast until golden.', 10],
        ['Mash the garlic and anchovies, then whisk with the yolk and lemon juice.'],
        ['Drizzle in the olive oil slowly while whisking to make a creamy dressing.'],
        ['Toss the lettuce with the dressing and most of the parmesan.'],
        ['Top with croutons and the remaining cheese.'],
      ]),
    },
  },
  {
    dish: {
      name: 'Pad thai',
      cuisine: 'Thai',
      description: 'Stir-fried rice noodles with egg, tofu or shrimp, peanuts, and a sweet-sour tamarind sauce.',
      confidence: 0.86,
      keyIngredients: ['Rice noodles', 'Eggs', 'Shrimp', 'Peanuts', 'Lime', 'Soy sauce'],
    },
    recipe: {
      title: 'Weeknight pad thai',
      description: 'A fast stir-fry with a pantry-friendly sauce standing in for tamarind.',
      emoji: '🍜',
      prepMinutes: 15,
      cookMinutes: 10,
      servings: 2,
      difficulty: 'medium',
      ingredients: [
        { name: 'Rice noodles', amount: '150 g', inPantry: false },
        { name: 'Shrimp', amount: '200 g', inPantry: false },
        { name: 'Eggs', amount: '2', inPantry: false },
        { name: 'Peanuts', amount: '3 tbsp', inPantry: false },
        { name: 'Soy sauce', amount: '2 tbsp', inPantry: false },
        { name: 'Sugar', amount: '1 tbsp', inPantry: false },
        { name: 'Lime', amount: '1', inPantry: false },
        { name: 'Garlic', amount: '2 cloves', inPantry: false },
        { name: 'Spring onion', amount: '2', inPantry: false },
      ],
      steps: steps([
        ['Soak the rice noodles in hot water until just pliable, then drain.', 8],
        ['Mix the soy sauce, sugar, and lime juice for the sauce.'],
        ['Stir-fry the garlic and shrimp over high heat until pink.', 3],
        ['Push everything aside, scramble the eggs in the pan, then toss together.'],
        ['Add the noodles and sauce and toss until coated and hot.', 3],
        ['Serve with crushed peanuts, spring onion, and lime wedges.'],
      ]),
    },
  },
];

function hash(input: string): number {
  let value = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    value ^= input.charCodeAt(i);
    value = Math.imul(value, 16777619) >>> 0;
  }
  return value;
}

function simulateDish(photoUri: string, seed: string, pantry: InventoryItem[]): DishScanResult {
  const pick = SIMULATED_DISHES[hash(seed) % SIMULATED_DISHES.length];
  const recipe: Recipe = { ...pick.recipe, id: createId(), createdAt: new Date().toISOString() };
  return {
    photoUri,
    dish: pick.dish,
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

async function identifyWithClaude(photo: PhotoInput, pantry: InventoryItem[], prefs: RecipePreferences, signal?: AbortSignal): Promise<DishScanResult> {
  if (!photo.base64) throw new AiError('The photo could not be read. Please try another one.', false);
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
            { type: 'text', text: `${pantryText}\n\n${describePreferences(prefs)}\n\nWhat dish is this, and how do I make it?` },
          ],
        },
      ],
    },
    { signal },
  );

  if (response.stop_reason === 'refusal') {
    throw new AiError('The chef declined to analyse this photo.', false);
  }
  const parsed = response.parsed_output;
  if (!parsed) throw new AiError('Could not read the dish analysis. Please try again.');

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
      throw new AiError('Dish analysis failed. Please try again.');
    }
  }

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, SIMULATION_DELAY_MS);
    options.signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new AiError('Dish analysis was cancelled.', false));
    });
  });
  return simulateDish(photo.uri, photo.assetId ?? photo.uri, pantry);
}
