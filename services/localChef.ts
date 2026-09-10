import { CHEF, fill, type ChefStrings } from '@/lib/content.i18n';
import { currentLocale, unitLabel } from '@/lib/i18n';
import { createId } from '@/lib/utils';
import type { Cuisine, InventoryItem, Recipe, RecipeIngredient, RecipePreferences, RecipeStep } from '@/types';

/**
 * Offline recipe generator used when no Claude API key is configured.
 * Deterministic for a given pantry and preferences, localised through
 * lib/content.i18n, and always returns three recipes so the app remains
 * usable (and testable) without network access.
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

const FRUIT = /lemon|lime|orange|apple|banana|berr|grape|mango|pear|peach|melon|pineapple|kiwi|plum|cherry|citron|pomme|banane|fraise|raisin|mangue|poire|pêche|ليمون|برتقال|تفاح|موز|فراولة|عنب|مانجو|كمثرى|خوخ|بطيخ/i;

/** Keywords (English, French, Arabic) that make an ingredient unsuitable for a diet or allergy. */
const MEAT = 'chicken|beef|pork|turkey|lamb|bacon|sausage|ham|steak|mince|duck|salami|chorizo|poulet|bœuf|boeuf|porc|dinde|agneau|lardon|saucisse|jambon|viande|merguez|canard|دجاج|لحم|بقر|ضأن|خروف|ديك|سجق|مرقاز|بط';
const FISH = 'salmon|tuna|shrimp|prawn|cod|fish|crab|mussel|clam|squid|anchov|sardine|tilapia|saumon|thon|crevette|cabillaud|poisson|crabe|moule|calamar|anchois|سلمون|تونة|روبيان|جمبري|قريدس|سمك|سردين|حبار|سلطعون|أنشوجة';
const DAIRY = 'milk|cheese|yogurt|yoghurt|butter|cream|parmesan|mozzarella|feta|ricotta|cheddar|kefir|lait|fromage|yaourt|beurre|crème|creme|حليب|جبن|زبادي|لبن|زبدة|كريمة|قشطة';
const EGG = 'egg|œuf|oeuf|بيض';
const PORK = 'pork|bacon|ham|salami|chorizo|lard|porc|lardon|jambon|لحم خنزير|خنزير';
const SHELLFISH = 'shrimp|prawn|crab|mussel|clam|squid|lobster|oyster|crevette|crabe|moule|calamar|homard|huître|روبيان|جمبري|قريدس|سلطعون|حبار|بلح البحر|محار';
const GLUTEN = 'wheat|flour|bread|pasta|spaghetti|penne|noodle|couscous|bulgur|barley|tortilla|bagel|soy sauce|beer|seitan|blé|farine|pain|pâtes|pates|nouille|semoule|orge|boulgour|sauce soja|bière|قمح|طحين|دقيق|خبز|معكرونة|مكرونة|نودلز|كسكسي|كسكس|برغل|شعير|صلصة صويا|سميد';

const DIET_BLOCK: Record<string, RegExp | null> = {
  none: null,
  vegetarian: new RegExp(`${MEAT}|${FISH}|gelatin|gélatine|جيلاتين`, 'i'),
  vegan: new RegExp(`${MEAT}|${FISH}|${DAIRY}|${EGG}|honey|miel|عسل|gelatin|gélatine|جيلاتين`, 'i'),
  pescatarian: new RegExp(MEAT, 'i'),
  halal: new RegExp(`${PORK}|wine|beer|vin|bière|نبيذ|بيرة|gelatin|gélatine|جيلاتين`, 'i'),
  kosher: new RegExp(`${PORK}|${SHELLFISH}`, 'i'),
  glutenFree: new RegExp(GLUTEN, 'i'),
};

const ALLERGEN_BLOCK: Record<string, RegExp> = {
  nuts: /nut|almond|walnut|cashew|pistachio|pecan|hazelnut|peanut|noix|amande|cajou|pistache|noisette|cacahu|مكسرات|لوز|جوز|كاجو|فستق|بندق|فول سوداني/i,
  dairy: new RegExp(DAIRY, 'i'),
  gluten: new RegExp(GLUTEN, 'i'),
  eggs: new RegExp(EGG, 'i'),
  shellfish: new RegExp(SHELLFISH, 'i'),
  soy: /soy|tofu|edamame|miso|tempeh|soja|صويا|توفو|ميسو/i,
  sesame: /sesame|tahini|sésame|sesame|سمسم|طحينة/i,
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

function strings(): ChefStrings {
  return CHEF[currentLocale()] ?? CHEF.en;
}

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
  return { name: item.name, amount: amount ?? `${item.quantity} ${unitLabel(item.unit)}`, inPantry: true };
}

function staple(name: string, amount: string, items: InventoryItem[]): RecipeIngredient {
  const needle = name.toLowerCase();
  const inPantry = items.some((item) => item.name.toLowerCase().includes(needle) || needle.includes(item.name.toLowerCase()));
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

function joinNames(items: InventoryItem[], fallback: string, and: string): string {
  if (items.length === 0) return fallback;
  const names = items.map((item) => item.name.toLowerCase());
  return names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')}${and}${names[names.length - 1]}`;
}

type Draft = Omit<Recipe, 'id' | 'createdAt'>;

function plantProtein(prefs: RecipePreferences, s: ChefStrings): RecipeIngredient {
  const options = [s.ing.chickpeas, s.ing.lentils, s.ing.tofu, s.ing.whiteBeans];
  const pick = options.find((option) => !isBlocked(option, prefs)) ?? s.ing.mushrooms;
  return { name: pick, amount: s.amount.can1, inPantry: false };
}

function skillet(p: PantryShape, prefs: RecipePreferences, s: ChefStrings): Draft {
  const protein = p.proteins[0];
  const veg = p.vegetables.slice(0, 2);
  const spice = p.spices[0];
  const proteinIngredient = protein ? pantryIngredient(protein, s.amount.servings2) : plantProtein(prefs, s);
  const vars = {
    protein: proteinIngredient.name.toLowerCase(),
    veg: joinNames(veg, s.fallback.veg, s.and),
    spice: spice ? `${s.and}${spice.name.toLowerCase()}` : '',
  };
  return {
    title: fill(s.skillet.title, vars),
    description: fill(s.skillet.description, vars),
    emoji: '🍳',
    prepMinutes: 10,
    cookMinutes: 20,
    servings: 2,
    difficulty: 'easy',
    ingredients: [
      proteinIngredient,
      ...veg.map((item) => pantryIngredient(item)),
      spice ? pantryIngredient(spice, s.amount.tsp1) : staple(s.ing.saltPepper, s.amount.toTaste, p.all),
      staple(s.ing.oliveOil, s.amount.tbsp2, p.all),
      staple(s.ing.garlic, s.amount.cloves2, p.all),
    ],
    steps: steps(s.skillet.steps.map((step, index) => [fill(step, vars), [0, 0, 6, 8, 5, 0][index] || undefined])),
  };
}

function grainBowl(p: PantryShape, prefs: RecipePreferences, s: ChefStrings): Draft {
  const base = p.bases[0];
  const veg = p.vegetables.slice(0, 3);
  const dairy = p.dairy.find((item) => /yog|feta|cheese|ricotta|fromage|yaourt|زبادي|جبن|لبن/i.test(item.name));
  const baseFallbackName = isBlocked(s.ing.rice, prefs) ? s.ing.quinoa : s.ing.rice;
  const vars = {
    base: base ? base.name : baseFallbackName,
    baseLower: lower(base, isBlocked(s.ing.rice, prefs) ? s.fallback.quinoa : s.fallback.rice),
    veg: joinNames(veg, s.fallback.crunchy, s.and),
    dairy: dairy ? fill(s.bowl.withDairy, { dairy: dairy.name.toLowerCase() }) : '',
    dairyStep: dairy ? fill(s.bowl.withDairy, { dairy: dairy.name.toLowerCase() }) : '',
  };
  return {
    title: fill(s.bowl.title, vars),
    description: fill(s.bowl.description, { ...vars, base: vars.baseLower }),
    emoji: '🥗',
    prepMinutes: 10,
    cookMinutes: 18,
    servings: 2,
    difficulty: 'easy',
    ingredients: [
      base ? pantryIngredient(base, s.amount.cup1) : { name: baseFallbackName, amount: s.amount.cup1, inPantry: false },
      ...veg.map((item) => pantryIngredient(item)),
      ...(dairy ? [pantryIngredient(dairy, s.amount.tbsp3)] : []),
      staple(s.ing.lemon, s.amount.one, p.all),
      staple(s.ing.oliveOil, s.amount.tbsp2, p.all),
      staple(s.ing.salt, s.amount.toTaste, p.all),
    ],
    steps: steps(s.bowl.steps.map((step, index) => [fill(step, { ...vars, base: vars.baseLower }), [15, 0, 0, 0, 0][index] || undefined])),
  };
}

function soupOrFrittata(p: PantryShape, prefs: RecipePreferences, s: ChefStrings): Draft {
  const eggs = p.dairy.find((item) => /egg|œuf|oeuf|بيض/i.test(item.name));
  const veg = p.vegetables.slice(0, 3);

  if (eggs && !isBlocked('eggs', prefs)) {
    const vars = { veg: joinNames(veg, s.fallback.leftover, s.and) };
    return {
      title: fill(s.frittata.title, vars),
      description: fill(s.frittata.description, vars),
      emoji: '🥚',
      prepMinutes: 8,
      cookMinutes: 17,
      servings: 3,
      difficulty: 'easy',
      ingredients: [
        pantryIngredient(eggs, s.amount.six),
        ...veg.map((item) => pantryIngredient(item)),
        isBlocked(s.ing.milk, prefs) ? staple(s.ing.water, s.amount.tbsp3, p.all) : staple(s.ing.milk, s.amount.tbsp3, p.all),
        isBlocked(s.ing.butter, prefs) ? staple(s.ing.oliveOil, s.amount.tbsp1, p.all) : staple(s.ing.butter, s.amount.tbsp1, p.all),
        staple(s.ing.saltPepper, s.amount.toTaste, p.all),
      ],
      steps: steps(s.frittata.steps.map((step, index) => [fill(step, vars), [0, 0, 5, 6, 6, 0][index] || undefined])),
    };
  }

  const vars = { veg: joinNames(veg, s.fallback.leftover, s.and) };
  return {
    title: fill(s.soup.title, vars),
    description: fill(s.soup.description, vars),
    emoji: '🍲',
    prepMinutes: 10,
    cookMinutes: 30,
    servings: 4,
    difficulty: 'easy',
    ingredients: [
      ...veg.map((item) => pantryIngredient(item)),
      staple(s.ing.onion, s.amount.one, p.all),
      staple(s.ing.stock, s.amount.l1, p.all),
      staple(s.ing.oliveOil, s.amount.tbsp1, p.all),
      p.spices[0] ? pantryIngredient(p.spices[0], s.amount.tsp1) : staple(s.ing.driedHerbs, s.amount.tsp1, p.all),
    ],
    steps: steps(s.soup.steps.map((step, index) => [fill(step, vars), [0, 5, 0, 20, 0][index] || undefined])),
  };
}

/** Applies a cuisine flavour profile: title, spice step, finishing step. */
function applyCuisine(draft: Draft, cuisine: Cuisine, s: ChefStrings): Draft {
  if (cuisine === 'any') return draft;
  const twist = s.cuisines[cuisine];
  const lastOrder = draft.steps.length;
  return {
    ...draft,
    title: fill(s.cuisinePrefix, { label: twist.label, title: draft.title }),
    description: fill(s.cuisineDescription, { description: draft.description, spice: twist.spice }),
    steps: [
      ...draft.steps.map((step, index) =>
        index === 0 ? { ...step, instruction: fill(s.cuisineFirstStep, { step: step.instruction, spice: twist.spice }) } : step,
      ),
      { order: lastOrder + 1, instruction: fill(s.cuisineFinish, { finish: twist.finish }) },
    ],
  };
}

/** Compresses cook times so prep + cook fits under the limit. */
function applyTimeCap(draft: Draft, maxMinutes: number | null, s: ChefStrings): Draft {
  if (!maxMinutes) return draft;
  const total = draft.prepMinutes + draft.cookMinutes;
  if (total <= maxMinutes) return draft;
  const factor = Math.max(0.4, (maxMinutes - draft.prepMinutes) / draft.cookMinutes);
  return {
    ...draft,
    title: fill(s.quick, { title: draft.title }),
    cookMinutes: Math.max(5, Math.round(draft.cookMinutes * factor)),
    steps: draft.steps.map((step) =>
      step.durationMinutes ? { ...step, durationMinutes: Math.max(1, Math.round(step.durationMinutes * factor)) } : step,
    ),
  };
}

function finalize(draft: Draft, prefs: RecipePreferences, s: ChefStrings): Recipe {
  const shaped = applyTimeCap(applyCuisine(draft, prefs.cuisine, s), prefs.maxMinutes, s);
  return {
    ...shaped,
    title: shaped.title.charAt(0).toUpperCase() + shaped.title.slice(1),
    ingredients: shaped.ingredients.filter((ingredient) => !isBlocked(ingredient.name, prefs)),
    id: createId(),
    createdAt: new Date().toISOString(),
  };
}

export function generateLocalRecipes(items: InventoryItem[], prefs: RecipePreferences = DEFAULT_PREFERENCES): Recipe[] {
  const s = strings();
  const p = shape(items, prefs);
  return [skillet(p, prefs, s), grainBowl(p, prefs, s), soupOrFrittata(p, prefs, s)].map((draft) => finalize(draft, prefs, s));
}

/** Five varied dinners for a weekly plan, rotating cuisines when none is chosen. */
export function generateLocalWeek(items: InventoryItem[], prefs: RecipePreferences = DEFAULT_PREFERENCES): Recipe[] {
  const s = strings();
  const p = shape(items, prefs);
  const rotation: Cuisine[] = prefs.cuisine === 'any' ? ['any', 'italian', 'asian', 'mediterranean', 'mexican'] : [prefs.cuisine];
  const builders = [skillet, grainBowl, soupOrFrittata, skillet, grainBowl];
  return builders.map((build, index) => {
    const cuisine = rotation[index % rotation.length];
    return finalize(build(p, prefs, s), { ...prefs, cuisine }, s);
  });
}
