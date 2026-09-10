import { AiError, generateRecipes } from '@/services/ai';
import { generateWeeklyPlan } from '@/services/planner';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useRecipeStore } from '@/store/useRecipeStore';
import { selectPreferences, useSettingsStore } from '@/store/useSettingsStore';

let inFlight: AbortController | null = null;

/**
 * Runs a generation against the current pantry and writes the outcome into
 * the recipe store. Safe to call from any screen; concurrent calls cancel the
 * previous request.
 */
export async function runRecipeGeneration(): Promise<void> {
  const items = useInventoryStore.getState().items;
  const recipes = useRecipeStore.getState();

  inFlight?.abort();
  const controller = new AbortController();
  inFlight = controller;

  recipes.startGeneration();
  try {
    const preferences = selectPreferences(useSettingsStore.getState());
    const result = await generateRecipes(items, { signal: controller.signal, preferences });
    if (controller.signal.aborted) return;
    useRecipeStore.getState().setGenerated(result);
  } catch (error) {
    if (controller.signal.aborted) return;
    const message = error instanceof AiError ? error.message : 'Something went wrong. Please try again.';
    useRecipeStore.getState().failGeneration(message);
  } finally {
    if (inFlight === controller) inFlight = null;
  }
}

export function cancelRecipeGeneration(): void {
  inFlight?.abort();
  inFlight = null;
}

let planInFlight: AbortController | null = null;

/** Generates a five-dinner plan into the recipe store. */
export async function runWeeklyPlan(): Promise<void> {
  const items = useInventoryStore.getState().items;
  planInFlight?.abort();
  const controller = new AbortController();
  planInFlight = controller;

  useRecipeStore.getState().startPlan();
  try {
    const preferences = selectPreferences(useSettingsStore.getState());
    const plan = await generateWeeklyPlan(items, preferences, { signal: controller.signal });
    if (controller.signal.aborted) return;
    useRecipeStore.getState().setPlan(plan);
  } catch (error) {
    if (controller.signal.aborted) return;
    const message = error instanceof AiError ? error.message : 'Something went wrong. Please try again.';
    useRecipeStore.getState().failPlan(message);
  } finally {
    if (planInFlight === controller) planInFlight = null;
  }
}

export function cancelWeeklyPlan(): void {
  planInFlight?.abort();
  planInFlight = null;
}
