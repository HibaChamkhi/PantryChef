export const UNITS = ['pcs', 'g', 'kg', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'bunch', 'pack'] as const;
export type Unit = (typeof UNITS)[number];

export const CATEGORIES = [
  'produce',
  'dairy',
  'meat',
  'seafood',
  'grains',
  'pantry',
  'spices',
  'frozen',
  'beverages',
  'other',
] as const;
export type Category = (typeof CATEGORIES)[number];

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
  category: Category;
  /** ISO 8601 timestamp */
  addedAt: string;
  /** ISO 8601 date, optional */
  expiresAt?: string;
}

export type NewInventoryItem = Pick<InventoryItem, 'name'> &
  Partial<Pick<InventoryItem, 'quantity' | 'unit' | 'category' | 'expiresAt'>>;

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface RecipeIngredient {
  name: string;
  amount: string;
  inPantry: boolean;
}

export interface RecipeStep {
  order: number;
  instruction: string;
  /** Optional timer for this step, in minutes */
  durationMinutes?: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  emoji: string;
  prepMinutes: number;
  cookMinutes: number;
  servings: number;
  difficulty: Difficulty;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  /** ISO 8601 timestamp */
  createdAt: string;
}

export interface DishIdentification {
  name: string;
  cuisine: string;
  description: string;
  /** 0..1 */
  confidence: number;
  keyIngredients: string[];
}

export interface DishScanResult {
  photoUri: string;
  dish: DishIdentification;
  recipes: Recipe[];
  /** True when produced by the offline simulation rather than Claude. */
  simulated: boolean;
}

/* ------------------------------- Preferences ------------------------------- */

export const DIETS = ['none', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher', 'glutenFree'] as const;
export type Diet = (typeof DIETS)[number];

export const ALLERGENS = ['nuts', 'dairy', 'gluten', 'eggs', 'shellfish', 'soy', 'sesame'] as const;
export type Allergen = (typeof ALLERGENS)[number];

export const CUISINES = ['any', 'italian', 'mediterranean', 'asian', 'mexican', 'indian', 'middleEastern', 'french'] as const;
export type Cuisine = (typeof CUISINES)[number];

export const LANGUAGES = ['system', 'en', 'fr', 'ar'] as const;
export type Language = (typeof LANGUAGES)[number];

export interface RecipePreferences {
  diet: Diet;
  /** Allergen keys plus free-text avoid list, all lower case. */
  avoid: string[];
  cuisine: Cuisine;
  /** Upper bound on prep + cook minutes, or null for no limit. */
  maxMinutes: number | null;
}

/* ------------------------------- Shopping list ------------------------------ */

export interface ShoppingItem {
  id: string;
  name: string;
  amount?: string;
  checked: boolean;
  /** Recipe that produced this line, when applicable. */
  recipeTitle?: string;
  addedAt: string;
}

/* ------------------------------- Waste tracker ------------------------------ */

export type StatEventType = 'added' | 'used' | 'wasted';

export interface StatEvent {
  id: string;
  type: StatEventType;
  itemName: string;
  at: string;
}

/* -------------------------------- Weekly plan ------------------------------- */

export interface PlanDay {
  /** 0 = Monday … 6 = Sunday */
  weekday: number;
  recipe: Recipe;
}

export interface WeeklyPlan {
  createdAt: string;
  days: PlanDay[];
}
