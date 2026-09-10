import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';

import { AiError, RecipeOutput, describePantry, describePreferences, getClient, hasApiKey, toAiError, toRecipe } from '@/services/ai';
import { markPantryMatches } from '@/services/dish';
import { generateLocalWeek } from '@/services/localChef';
import type { InventoryItem, RecipePreferences, WeeklyPlan } from '@/types';

const MODEL = process.env.EXPO_PUBLIC_CLAUDE_MODEL?.trim() || 'claude-opus-5';
const LOCAL_DELAY_MS = 1500;

const WeekOutput = z.object({
  dinners: z.array(RecipeOutput),
});

const SYSTEM_PROMPT = `You are PantryChef, a practical home cook planning a week of dinners for someone who wants to waste less food.
Plan exactly five dinners (Monday to Friday) that together use as much of the pantry as possible, using expiring items early in the week and reusing bought ingredients across days so the shopping list stays short.
Vary the style across the week. Each recipe: 4 to 10 ingredients (inPantry=true only for pantry items), 4 to 8 clear steps, durationMinutes only where a timer helps (null otherwise), one food emoji.`;

export async function generateWeeklyPlan(
  items: InventoryItem[],
  prefs: RecipePreferences,
  options: { signal?: AbortSignal } = {},
): Promise<WeeklyPlan> {
  if (items.length === 0) throw new AiError('Add at least one ingredient to your pantry first.', false);

  if (!hasApiKey()) {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, LOCAL_DELAY_MS);
      options.signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new AiError('Planning was cancelled.', false));
      });
    });
    const recipes = generateLocalWeek(items, prefs);
    return { createdAt: new Date().toISOString(), days: recipes.map((recipe, weekday) => ({ weekday, recipe })) };
  }

  try {
    const response = await getClient().messages.parse(
      {
        model: MODEL,
        max_tokens: 24000,
        system: SYSTEM_PROMPT,
        output_config: { format: zodOutputFormat(WeekOutput), effort: 'medium' },
        messages: [
          {
            role: 'user',
            content: `Pantry:\n${describePantry(items)}\n\n${describePreferences(prefs)}\n\nPlan five dinners, Monday to Friday, in order.`,
          },
        ],
      },
      { signal: options.signal },
    );
    if (response.stop_reason === 'refusal') throw new AiError('The chef declined this request.', false);
    const parsed = response.parsed_output;
    if (!parsed || parsed.dinners.length === 0) throw new AiError('The planner returned an unreadable answer. Please try again.');
    const recipes = markPantryMatches(parsed.dinners.map(toRecipe).filter((recipe) => recipe.steps.length > 0), items).slice(0, 5);
    return { createdAt: new Date().toISOString(), days: recipes.map((recipe, weekday) => ({ weekday, recipe })) };
  } catch (error) {
    if (error instanceof Anthropic.APIError || error instanceof AiError) throw toAiError(error);
    throw new AiError('Something went wrong while planning. Please try again.');
  }
}
