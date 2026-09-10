import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';

import { categorize } from '@/lib/categorize';
import { AiError, getClient, hasApiKey, toAiError } from '@/services/ai';
import type { DetectedIngredient, PhotoInput } from '@/services/vision';
import { UNITS, type Unit } from '@/types';

/**
 * Receipt scan: extract grocery line items from a photo of a till receipt.
 * Non-food lines (bags, deposits, totals) are skipped.
 */

const MODEL = process.env.EXPO_PUBLIC_CLAUDE_MODEL?.trim() || 'claude-opus-5';
const SIMULATION_DELAY_MS = 2000;

const SIMULATED_RECEIPTS: DetectedIngredient[][] = [
  [
    { name: 'Whole milk', quantity: 1, unit: 'l', category: 'dairy', confidence: 0.97 },
    { name: 'Bananas', quantity: 6, unit: 'pcs', category: 'produce', confidence: 0.95 },
    { name: 'Chicken breast', quantity: 500, unit: 'g', category: 'meat', confidence: 0.92 },
    { name: 'Penne', quantity: 500, unit: 'g', category: 'grains', confidence: 0.94 },
    { name: 'Cheddar cheese', quantity: 200, unit: 'g', category: 'dairy', confidence: 0.9 },
    { name: 'Cucumber', quantity: 1, unit: 'pcs', category: 'produce', confidence: 0.93 },
    { name: 'Olive oil', quantity: 500, unit: 'ml', category: 'pantry', confidence: 0.91 },
  ],
  [
    { name: 'Eggs', quantity: 12, unit: 'pcs', category: 'dairy', confidence: 0.98 },
    { name: 'Tomatoes', quantity: 5, unit: 'pcs', category: 'produce', confidence: 0.94 },
    { name: 'Onions', quantity: 3, unit: 'pcs', category: 'produce', confidence: 0.93 },
    { name: 'Canned chickpeas', quantity: 2, unit: 'pack', category: 'pantry', confidence: 0.9 },
    { name: 'Salmon fillet', quantity: 300, unit: 'g', category: 'seafood', confidence: 0.88 },
    { name: 'Greek yogurt', quantity: 500, unit: 'g', category: 'dairy', confidence: 0.92 },
  ],
  [
    { name: 'Basmati rice', quantity: 1, unit: 'kg', category: 'grains', confidence: 0.96 },
    { name: 'Spinach', quantity: 1, unit: 'bunch', category: 'produce', confidence: 0.9 },
    { name: 'Lemons', quantity: 4, unit: 'pcs', category: 'produce', confidence: 0.94 },
    { name: 'Feta cheese', quantity: 200, unit: 'g', category: 'dairy', confidence: 0.91 },
    { name: 'Garlic', quantity: 1, unit: 'pcs', category: 'produce', confidence: 0.89 },
    { name: 'Cumin', quantity: 1, unit: 'pack', category: 'spices', confidence: 0.87 },
    { name: 'Orange juice', quantity: 1, unit: 'l', category: 'beverages', confidence: 0.93 },
    { name: 'Frozen peas', quantity: 1, unit: 'pack', category: 'frozen', confidence: 0.92 },
  ],
];

function hash(input: string): number {
  let value = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    value ^= input.charCodeAt(i);
    value = Math.imul(value, 16777619) >>> 0;
  }
  return value;
}

const ReceiptOutput = z.object({
  items: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(),
      unit: z.enum(UNITS),
      confidence: z.number(),
    }),
  ),
});

async function readWithClaude(photo: PhotoInput, signal?: AbortSignal): Promise<DetectedIngredient[]> {
  if (!photo.base64) throw new AiError('The photo could not be read. Please try another one.', false);
  const mediaType = photo.mimeType === 'image/png' ? 'image/png' : photo.mimeType === 'image/webp' ? 'image/webp' : 'image/jpeg';

  const response = await getClient().messages.parse(
    {
      model: MODEL,
      max_tokens: 6000,
      system:
        'You read grocery receipts. Extract every food or drink line item as a clean ingredient name (no brand codes or abbreviations), an estimated quantity, a unit from the allowed list, and a confidence 0-1. Skip bags, deposits, discounts, totals, and non-food items. Return an empty list if the image is not a receipt.',
      output_config: { format: zodOutputFormat(ReceiptOutput), effort: 'low' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: photo.base64 } },
            { type: 'text', text: 'List the groceries on this receipt.' },
          ],
        },
      ],
    },
    { signal },
  );

  const parsed = response.parsed_output;
  if (!parsed) throw new AiError('Could not read the receipt. Please try again.');
  return parsed.items
    .filter((item) => item.name.trim())
    .map((item) => ({
      name: item.name.trim(),
      quantity: Math.max(1, Math.round(item.quantity || 1)),
      unit: item.unit as Unit,
      category: categorize(item.name),
      confidence: Math.min(1, Math.max(0, item.confidence)),
    }));
}

export async function recognizeReceipt(
  photo: PhotoInput,
  options: { signal?: AbortSignal } = {},
): Promise<{ items: DetectedIngredient[]; simulated: boolean }> {
  if (hasApiKey() && photo.base64) {
    try {
      return { items: await readWithClaude(photo, options.signal), simulated: false };
    } catch (error) {
      if (error instanceof Anthropic.APIError || error instanceof AiError) throw toAiError(error);
      throw new AiError('Receipt analysis failed. Please try again.');
    }
  }

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, SIMULATION_DELAY_MS);
    options.signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new AiError('Receipt analysis was cancelled.', false));
    });
  });
  return { items: SIMULATED_RECEIPTS[hash(photo.uri) % SIMULATED_RECEIPTS.length], simulated: true };
}
