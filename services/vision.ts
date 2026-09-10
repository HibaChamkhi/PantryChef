import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';

import { categorize } from '@/lib/categorize';
import { VISION_NAMES } from '@/lib/content.i18n';
import { currentLocale, languageName, t } from '@/lib/i18n';
import { AiError, hasApiKey } from '@/services/ai';
import type { NewInventoryItem, Unit } from '@/types';
import { UNITS } from '@/types';

export interface DetectedIngredient extends Required<Pick<NewInventoryItem, 'name' | 'quantity' | 'unit' | 'category'>> {
  /** 0..1, used purely for display */
  confidence: number;
}

const SIMULATION_DELAY_MS = 1800;

const SIMULATED_POOL: Array<Omit<DetectedIngredient, 'category'>> = [
  { name: 'Tomatoes', quantity: 4, unit: 'pcs', confidence: 0.96 },
  { name: 'Eggs', quantity: 6, unit: 'pcs', confidence: 0.98 },
  { name: 'Cheddar cheese', quantity: 200, unit: 'g', confidence: 0.91 },
  { name: 'Bell pepper', quantity: 2, unit: 'pcs', confidence: 0.88 },
  { name: 'Milk', quantity: 1, unit: 'l', confidence: 0.94 },
  { name: 'Carrots', quantity: 5, unit: 'pcs', confidence: 0.93 },
  { name: 'Onion', quantity: 2, unit: 'pcs', confidence: 0.9 },
  { name: 'Chicken breast', quantity: 2, unit: 'pcs', confidence: 0.85 },
  { name: 'Spinach', quantity: 1, unit: 'bunch', confidence: 0.87 },
  { name: 'Mushrooms', quantity: 250, unit: 'g', confidence: 0.82 },
  { name: 'Lemons', quantity: 2, unit: 'pcs', confidence: 0.95 },
  { name: 'Pasta', quantity: 500, unit: 'g', confidence: 0.9 },
  { name: 'Broccoli', quantity: 1, unit: 'pcs', confidence: 0.89 },
  { name: 'Greek yogurt', quantity: 500, unit: 'g', confidence: 0.86 },
];

function hash(input: string): number {
  let value = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    value ^= input.charCodeAt(i);
    value = Math.imul(value, 16777619) >>> 0;
  }
  return value;
}

/** Deterministic pseudo-recognition so the same photo always yields the same list. */
function simulateRecognition(imageUri: string): DetectedIngredient[] {
  const names = VISION_NAMES[currentLocale()] ?? VISION_NAMES.en;
  const seed = hash(imageUri);
  const count = 4 + (seed % 3);
  const start = seed % SIMULATED_POOL.length;
  const stride = 1 + ((seed >>> 8) % 5);
  const picked: DetectedIngredient[] = [];
  const seen = new Set<number>();

  for (let i = 0; picked.length < count && i < SIMULATED_POOL.length * 2; i += 1) {
    const index = (start + i * stride) % SIMULATED_POOL.length;
    if (seen.has(index)) continue;
    seen.add(index);
    const base = SIMULATED_POOL[index];
    const name = names[index] ?? base.name;
    picked.push({ ...base, name, category: categorize(name) });
  }
  return picked;
}

const DetectionOutput = z.object({
  items: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(),
      unit: z.enum(UNITS),
      confidence: z.number(),
    }),
  ),
});

let client: Anthropic | null = null;

async function recognizeWithClaude(base64: string, mimeType: string, signal?: AbortSignal): Promise<DetectedIngredient[]> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY?.trim();
  if (!hasApiKey()) throw new AiError(t('errors.noKey'), false);
  const model = process.env.EXPO_PUBLIC_CLAUDE_MODEL?.trim() || 'claude-opus-5';
  if (!apiKey) throw new AiError(t('errors.noKey'), false);
  if (!client) client = new Anthropic({ apiKey, timeout: 60_000, maxRetries: 2 });

  const mediaType = mimeType === 'image/png' ? 'image/png' : mimeType === 'image/webp' ? 'image/webp' : 'image/jpeg';

  const response = await client.messages.parse(
    {
      model,
      max_tokens: 4000,
      system:
        `You identify groceries in photos. List each distinct food item you can see with an estimated quantity, a unit from the allowed list, and a confidence between 0 and 1. Ignore non-food objects. If nothing edible is visible, return an empty list. Write item names in ${languageName()}.`,
      output_config: { format: zodOutputFormat(DetectionOutput), effort: 'low' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: 'What food items are in this photo?' },
          ],
        },
      ],
    },
    { signal },
  );

  const parsed = response.parsed_output;
  if (!parsed) throw new AiError(t('errors.unreadable'));

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

export interface PhotoInput {
  uri: string;
  base64?: string | null;
  mimeType?: string | null;
  /** Stable library identifier when the photo came from the picker. */
  assetId?: string | null;
}

/**
 * Recognises ingredients in a photo. With an API key it sends the image to
 * Claude; without one it runs a deterministic simulation so the flow can be
 * exercised end-to-end offline.
 */
export async function recognizeIngredients(
  photo: PhotoInput,
  options: { signal?: AbortSignal } = {},
): Promise<{ items: DetectedIngredient[]; simulated: boolean }> {
  if (hasApiKey() && photo.base64) {
    try {
      const items = await recognizeWithClaude(photo.base64, photo.mimeType ?? 'image/jpeg', options.signal);
      return { items, simulated: false };
    } catch (error) {
      if (error instanceof AiError) throw error;
      if (error instanceof Anthropic.AuthenticationError) {
        throw new AiError(t('errors.keyRejected'), false);
      }
      if (error instanceof Anthropic.APIConnectionError) {
        throw new AiError(t('errors.offline'));
      }
      throw new AiError(t('errors.photoFailed'));
    }
  }

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, SIMULATION_DELAY_MS);
    options.signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new AiError(t('errors.cancelled'), false));
    });
  });
  return { items: simulateRecognition(photo.uri), simulated: true };
}
