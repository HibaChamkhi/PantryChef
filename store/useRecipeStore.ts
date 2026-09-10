import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_KEYS, createAsyncStorage } from '@/services/storage';
import type { DishScanResult, Recipe, WeeklyPlan } from '@/types';

export type GenerationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface RecipeState {
  /** Latest AI-generated results; not persisted. */
  generated: Recipe[];
  status: GenerationStatus;
  error: string | null;
  /** Recipes the user bookmarked; persisted. */
  saved: Recipe[];

  /** Weekly plan; persisted so it survives restarts. */
  plan: WeeklyPlan | null;
  planStatus: GenerationStatus;
  planError: string | null;
  startPlan: () => void;
  setPlan: (plan: WeeklyPlan) => void;
  failPlan: (message: string) => void;
  clearPlan: () => void;

  /** Latest dish scan (photo of a meal); not persisted. */
  scan: DishScanResult | null;
  scanStatus: GenerationStatus;
  scanError: string | null;
  startScan: () => void;
  setScan: (result: DishScanResult) => void;
  failScan: (message: string) => void;
  resetScan: () => void;

  startGeneration: () => void;
  setGenerated: (recipes: Recipe[]) => void;
  failGeneration: (message: string) => void;
  resetGeneration: () => void;

  saveRecipe: (recipe: Recipe) => void;
  unsaveRecipe: (id: string) => void;
  toggleSaved: (recipe: Recipe) => boolean;
  isSaved: (id: string) => boolean;
  /** Looks a recipe up in generated results first, then in saved. */
  getRecipe: (id: string) => Recipe | undefined;
}

interface PersistedRecipes {
  saved: Recipe[];
  plan: WeeklyPlan | null;
}

export const useRecipeStore = create<RecipeState>()(
  persist(
    (set, get) => ({
      generated: [],
      status: 'idle',
      error: null,
      saved: [],

      plan: null,
      planStatus: 'idle',
      planError: null,
      startPlan: () => set({ planStatus: 'loading', planError: null }),
      setPlan: (plan) => set({ plan, planStatus: 'success', planError: null }),
      failPlan: (message) => set({ planStatus: 'error', planError: message }),
      clearPlan: () => set({ plan: null, planStatus: 'idle', planError: null }),

      scan: null,
      scanStatus: 'idle',
      scanError: null,
      startScan: () => set({ scanStatus: 'loading', scanError: null }),
      setScan: (result) => set({ scan: result, scanStatus: 'success', scanError: null }),
      failScan: (message) => set({ scanStatus: 'error', scanError: message }),
      resetScan: () => set({ scan: null, scanStatus: 'idle', scanError: null }),

      startGeneration: () => set({ status: 'loading', error: null }),
      setGenerated: (recipes) => set({ generated: recipes, status: 'success', error: null }),
      failGeneration: (message) => set({ status: 'error', error: message }),
      resetGeneration: () => set({ generated: [], status: 'idle', error: null }),

      saveRecipe: (recipe) =>
        set((state) =>
          state.saved.some((saved) => saved.id === recipe.id)
            ? state
            : { saved: [recipe, ...state.saved] },
        ),

      unsaveRecipe: (id) => set((state) => ({ saved: state.saved.filter((recipe) => recipe.id !== id) })),

      toggleSaved: (recipe) => {
        const currentlySaved = get().isSaved(recipe.id);
        if (currentlySaved) {
          get().unsaveRecipe(recipe.id);
        } else {
          get().saveRecipe(recipe);
        }
        return !currentlySaved;
      },

      isSaved: (id) => get().saved.some((recipe) => recipe.id === id),

      getRecipe: (id) =>
        get().generated.find((recipe) => recipe.id === id) ??
        get().scan?.recipes.find((recipe) => recipe.id === id) ??
        get().plan?.days.find((day) => day.recipe.id === id)?.recipe ??
        get().saved.find((recipe) => recipe.id === id),
    }),
    {
      name: STORAGE_KEYS.recipes,
      storage: createAsyncStorage<PersistedRecipes>(),
      partialize: (state) => ({ saved: state.saved, plan: state.plan }),
      version: 1,
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('[recipes] failed to restore from storage', error);
        } else if (state?.plan) {
          state.planStatus = 'success';
        }
      },
    },
  ),
);
