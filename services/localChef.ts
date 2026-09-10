import { createId } from '@/lib/utils';
import type { Cuisine, InventoryItem, Recipe, RecipeIngredient, RecipePreferences, RecipeStep } from '@/types';

/**
 * Offline recipe generator used when no Claude API key is configured.
 * Deterministic for a given pantry and preferences; always returns three
 * recipes so the app remains usable (and testable) without network access.
 */

interface PantryShape {
  proteins: InventoryItem[];
  vegetables: InventoryItem[];
  bases: InventoryItem[];
  dairy: InventoryItem[];
  spices: InventoryItem[];
  pantry: InventoryItem[];
  all: InventoryItem[];
}

export const DEFAULT_PREFERENCES: RecipePreferences = { diet: 'none', avoid: [], cuisine: 'any', maxMinutes: null };

const FRUIT = /lemon|lime|orange|apple|banana|berr|grape|mango|pear|peach|melon|pineapple|kiwi|plum|cherry/i;

/** Keywords that make an ingredient unsuitable for a diet or allergy. */
const DIET_BLOCK: Record<string, RegExp | null> = {
  none: null,
  vegetarian: /chicken|beef|pork|turkey|lamb|bacon|sausage|ham|steak|mince|duck|salami|chorizo|salmon|tuna|shrimp|prawn|cod|fish|crab|mussel|clam|squid|anchov|sardine|tilapia|gelatin/i,
  vegan: /chicken|beef|pork|turkey|lamb|bacon|sausage|ham|steak|mince|duck|salami|chorizo|salmon|tuna|shrimp|prawn|cod|fish|crab|mussel|clam|squid|anchov|sardine|tilapia|egg|milk|cheese|yogurt|yoghurt|butter|cream|honey|parmesan|mozzarella|feta|ricotta|cheddar|gelatin/i,
  pescatarian: /chicken|beef|pork|turkey|lamb|bacon|sausage|ham|steak|mince|duck|salami|chorizo/i,
  halal: /pork|bacon|ham|salami|chorizo|lard|wine|beer|gelatin/i,
  kosher: /pork|bacon|ham|salami|chorizo|shrimp|prawn|crab|mussel|clam|squid|lobster|oyster/i,
  glutenFree: /wheat|flour|bread|pasta|spaghetti|penne|noodle|couscous|bulgur|barley|tortilla|bagel|soy sauce|beer|seitan/i,
};

const ALLERGEN_BLOCK: Record<string, RegExp> = {
  nuts: /nut|almond|walnut|cashew|pistachio|pecan|hazelnut|peanut/i,
  dairy: /milk|cheese|yogurt|yoghurt|butter|cream|parmesan|mozzarella|feta|ricotta|cheddar|kefir/i,
  gluten: /wheat|flour|bread|pasta|spaghetti|penne|noodle|couscous|bulgur|barley|tortilla|bagel|soy sauce/i,
  eggs: /egg/i,
  shellfish: /shrimp|prawn|crab|mussel|clam|squid|lobster|oyster/i,
  soy: /soy|tofu|edamame|miso|tempeh/i,
  sesame: /sesame|tahini/i,
};

export function isBlocked(name: string, prefs: RecipePreferences): boolean {
  const diet = DIET_BLOCK[prefs.diet];
  if (diet && diet.test(name)) return true;
  for (const avoid of prefs.avoid) {
    const known = ALLERGEN_BLOCK[avoid];
    if (known ? known.test(name) : name.toLowerCase().includes(avoid.toLowerCase())) return true;
  }
  return false;
}

const CUISINE_TWIST: Record<Cuisine, { label: string; spice: string; finish: string; emoji?: string } | null> = {
  any: null,
  italian: { label: 'Italian', spice: 'oregano and a pinch of chilli', finish: 'a handful of torn basil and grated parmesan' },
  mediterranean: { label: 'Mediterranean', spice: 'oregano and lemon zest', finish: 'olives, lemon juice, and a drizzle of good olive oil' },
  asian: { label: 'Asian', spice: 'ginger and a splash of soy sauce', finish: 'sliced spring onion and a few drops of sesame oil' },
  mexican: { label: 'Mexican', spice: 'cumin and smoked chilli', finish: 'lime juice and chopped coriander' },
  indian: { label: 'Indian', spice: 'garam masala and turmeric', finish: 'a spoon of yogurt and fresh coriander' },
  middleEastern: { label: 'Middle Eastern', spice: 'cumin and sumac', finish: 'chopped parsley, mint, and a squeeze of lemon' },
  french: { label: 'French', spice: 'thyme and a bay leaf', finish: 'a knob of butter and chopped parsley' },
};

function shape(items: InventoryItem[], prefs: RecipePreferences): PantryShape {
  const usable = items.filter((item) => !isBlocked(item.name, prefs));
  const by = (category: InventoryItem['category']) => usable.filter((item) => item.category === category);
  return {
    proteins: [...by('meat'), ...by('seafood')],
    vegetables: by('produce').filter((item) => !FRUIT.test(item.name)),
    bases: by('grains'),
    dairy: by('dairy'),
    spices: by('spices'),
    pantry: by('pantry'),
    all: usable,
  };
}

function pantryIngredient(item: InventoryItem, amount?: string): RecipeIngredient {
  return { name: item.name, amount: amount ?? `${item.quantity} ${item.unit}`, inPantry: true };
}

function staple(name: string, amount: string, items: InventoryItem[]): RecipeIngredient {
  const inPantry = items.some((item) => item.name.toLowerCase().includes(name.toLowerCase()));
  return { name, amount, inPantry };
}

function steps(list: Array<[string, number?]>): RecipeStep[] {
  return list.map(([instruction, durationMinutes], index) => ({
    order: index + 1,
    instruction,
    ...(durationMinutes ? { durationMinutes } : {}),
  }));
}

function lower(item: InventoryItem | undefined, fallback: string): string {
  return item ? item.name.toLowerCase() : fallback;
}

function joinNames(items: InventoryItem[], fallback: string): string {
  if (items.length === 0) return fallback;
  const names = items.map((item) => item.name.toLowerCase());
  return names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

type Draft = Omit<Recipe, 'id' | 'createdAt'>;

function plantProtein(prefs: RecipePreferences): RecipeIngredient {
  const options = ['Chickpeas', 'Lentils', 'Tofu', 'White beans'];
  const pick = options.find((option) => !isBlocked(option, prefs)) ?? 'Mushrooms';
  return { name: pick, amount: '1 can', inPantry: false };
}

function skillet(p: PantryShape, prefs: RecipePreferences): Draft {
  const protein = p.proteins[0];
  const veg = p.vegetables.slice(0, 2);
  const spice = p.spices[0];
  const proteinIngredient = protein ? pantryIngredient(protein, '2 servings') : plantProtein(prefs);
  const proteinName = proteinIngredient.name.toLowerCase();
  const vegNames = joinNames(veg, 'whatever vegetables you have');

  return {
    title: `One-pan ${proteinName} with ${vegNames}`,
    description: `A weeknight skillet that browns the ${proteinName} first, then finishes the vegetables in the same pan so nothing goes to waste.`,
    emoji: '🍳',
    prepMinutes: 10,
    cookMinutes: 20,
    servings: 2,
    difficulty: 'easy',
    ingredients: [
      proteinIngredient,
      ...veg.map((item) => pantryIngredient(item)),
      spice ? pantryIngredient(spice, '1 tsp') : staple('Salt and pepper', 'to taste', p.all),
      staple('Olive oil', '2 tbsp', p.all),
      staple('Garlic', '2 cloves', p.all),
    ],
    steps: steps([
      [`Pat the ${proteinName} dry and season generously with salt${spice ? ` and ${spice.name.toLowerCase()}` : ''}.`],
      ['Heat the olive oil in a large pan over medium-high heat until it shimmers.'],
      [`Sear the ${proteinName} without moving it so it browns properly.`, 6],
      [`Flip, add the garlic and ${vegNames}, and cook until the vegetables are just tender.`, 8],
      ['Reduce the heat, cover, and let everything finish cooking through.', 5],
      ['Taste, adjust the seasoning, and serve straight from the pan.'],
    ]),
  };
}

function grainBowl(p: PantryShape, prefs: RecipePreferences): Draft {
  const base = p.bases[0];
  const veg = p.vegetables.slice(0, 3);
  const dairy = p.dairy.find((item) => /yog|feta|cheese|ricotta/i.test(item.name));
  const baseFallback = isBlocked('rice', prefs) ? 'quinoa' : 'rice';
  const baseName = lower(base, baseFallback);
  const vegNames = joinNames(veg, 'crunchy vegetables');

  return {
    title: `${base ? base.name : baseFallback.charAt(0).toUpperCase() + baseFallback.slice(1)} bowl with ${vegNames}`,
    description: `Fluffy ${baseName} topped with ${vegNames}${dairy ? ` and a spoon of ${dairy.name.toLowerCase()}` : ''}, finished with a bright lemony dressing.`,
    emoji: '🥗',
    prepMinutes: 10,
    cookMinutes: 18,
    servings: 2,
    difficulty: 'easy',
    ingredients: [
      base ? pantryIngredient(base, '1 cup') : { name: baseFallback.charAt(0).toUpperCase() + baseFallback.slice(1), amount: '1 cup', inPantry: false },
      ...veg.map((item) => pantryIngredient(item)),
      ...(dairy ? [pantryIngredient(dairy, '3 tbsp')] : []),
      staple('Lemon', '1', p.all),
      staple('Olive oil', '2 tbsp', p.all),
      staple('Salt', 'to taste', p.all),
    ],
    steps: steps([
      [`Rinse the ${baseName} and cook it according to the package instructions.`, 15],
      [`While it cooks, chop the ${vegNames} into bite-sized pieces.`],
      ['Whisk the lemon juice with olive oil and a pinch of salt to make a dressing.'],
      [`Fluff the ${baseName} and divide it between two bowls.`],
      [`Pile the vegetables on top${dairy ? `, add the ${dairy.name.toLowerCase()}` : ''}, and drizzle with the dressing.`],
    ]),
  };
}

function soupOrFrittata(p: PantryShape, prefs: RecipePreferences): Draft {
  const eggs = p.dairy.find((item) => /egg/i.test(item.name));
  const veg = p.vegetables.slice(0, 3);
  const vegNames = joinNames(veg, 'leftover vegetables');

  if (eggs && !isBlocked('eggs', prefs)) {
    return {
      title: `Everything frittata with ${vegNames}`,
      description: `The best way to clear the fridge: eggs bind ${vegNames} into a golden frittata you can eat warm or cold.`,
      emoji: '🥚',
      prepMinutes: 8,
      cookMinutes: 17,
      servings: 3,
      difficulty: 'easy',
      ingredients: [
        pantryIngredient(eggs, '6'),
        ...veg.map((item) => pantryIngredient(item)),
        isBlocked('milk', prefs) ? staple('Water', '3 tbsp', p.all) : staple('Milk', '3 tbsp', p.all),
        isBlocked('butter', prefs) ? staple('Olive oil', '1 tbsp', p.all) : staple('Butter', '1 tbsp', p.all),
        staple('Salt and pepper', 'to taste', p.all),
      ],
      steps: steps([
        ['Preheat the grill or oven to 200°C (390°F).'],
        ['Whisk the eggs with the liquid, salt, and pepper.'],
        [`Warm the fat in an ovenproof pan and soften the ${vegNames}.`, 5],
        ['Pour in the eggs and cook gently until the edges set.', 6],
        ['Transfer to the oven until the top is puffed and golden.', 6],
        ['Rest for a minute, then slice into wedges.'],
      ]),
    };
  }

  return {
    title: `Rustic ${vegNames} soup`,
    description: `A forgiving, chunky soup that turns ${vegNames} into a comforting bowl with a handful of pantry staples.`,
    emoji: '🍲',
    prepMinutes: 10,
    cookMinutes: 30,
    servings: 4,
    difficulty: 'easy',
    ingredients: [
      ...veg.map((item) => pantryIngredient(item)),
      staple('Onion', '1', p.all),
      staple('Vegetable stock', '1 l', p.all),
      staple('Olive oil', '1 tbsp', p.all),
      p.spices[0] ? pantryIngredient(p.spices[0], '1 tsp') : staple('Dried herbs', '1 tsp', p.all),
    ],
    steps: steps([
      ['Dice the onion and chop the vegetables into even chunks.'],
      ['Soften the onion in olive oil over medium heat.', 5],
      [`Add the ${vegNames} and herbs and stir for a minute.`],
      ['Pour in the stock, bring to a simmer, and cook until everything is tender.', 20],
      ['Blend half the soup for body, or leave it chunky. Season and serve.'],
    ]),
  };
}

/** Applies a cuisine flavour profile to a draft: title prefix, spice step, finishing step. */
function applyCuisine(draft: Draft, cuisine: Cuisine): Draft {
  const twist = CUISINE_TWIST[cuisine];
  if (!twist) return draft;
  const lastOrder = draft.steps.length;
  return {
    ...draft,
    title: `${twist.label} ${draft.title.charAt(0).toLowerCase()}${draft.title.slice(1)}`,
    description: `${draft.description} Seasoned with ${twist.spice}.`,
    steps: [
      ...draft.steps.map((step, index) =>
        index === 0 ? { ...step, instruction: `${step.instruction} Add ${twist.spice}.` } : step,
      ),
      { order: lastOrder + 1, instruction: `Finish with ${twist.finish}.` },
    ],
  };
}

/** Compresses cook times so prep + cook fits under the limit. */
function applyTimeCap(draft: Draft, maxMinutes: number | null): Draft {
  if (!maxMinutes) return draft;
  const total = draft.prepMinutes + draft.cookMinutes;
  if (total <= maxMinutes) return draft;
  const factor = Math.max(0.4, (maxMinutes - draft.prepMinutes) / draft.cookMinutes);
  return {
    ...draft,
    title: `Quick ${draft.title.charAt(0).toLowerCase()}${draft.title.slice(1)}`,
    cookMinutes: Math.max(5, Math.round(draft.cookMinutes * factor)),
    steps: draft.steps.map((step) =>
      step.durationMinutes ? { ...step, durationMinutes: Math.max(1, Math.round(step.durationMinutes * factor)) } : step,
    ),
  };
}

function finalize(draft: Draft, prefs: RecipePreferences): Recipe {
  const shaped = applyTimeCap(applyCuisine(draft, prefs.cuisine), prefs.maxMinutes);
  return {
    ...shaped,
    ingredients: shaped.ingredients.filter((ingredient) => !isBlocked(ingredient.name, prefs)),
    id: createId(),
    createdAt: new Date().toISOString(),
  };
}

export function generateLocalRecipes(items: InventoryItem[], prefs: RecipePreferences = DEFAULT_PREFERENCES): Recipe[] {
  const p = shape(items, prefs);
  return [skillet(p, prefs), grainBowl(p, prefs), soupOrFrittata(p, prefs)].map((draft) => finalize(draft, prefs));
}

/** Five varied dinners for a weekly plan, rotating cuisines when none is chosen. */
export function generateLocalWeek(items: InventoryItem[], prefs: RecipePreferences = DEFAULT_PREFERENCES): Recipe[] {
  const p = shape(items, prefs);
  const rotation: Cuisine[] = prefs.cuisine === 'any' ? ['any', 'italian', 'asian', 'mediterranean', 'mexican'] : [prefs.cuisine];
  const builders = [skillet, grainBowl, soupOrFrittata, skillet, grainBowl];
  return builders.map((build, index) => {
    const cuisine = rotation[index % rotation.length];
    return finalize(build(p, prefs), { ...prefs, cuisine });
  });
}
