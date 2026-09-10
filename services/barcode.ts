import { categorize } from '@/lib/categorize';
import type { Category } from '@/types';

/**
 * Product lookup through Open Food Facts, a free, keyless, community database.
 * https://world.openfoodfacts.org/data
 */

export interface BarcodeProduct {
  code: string;
  name: string;
  brand?: string;
  quantity?: string;
  category: Category;
  imageUrl?: string;
}

const ENDPOINT = 'https://world.openfoodfacts.org/api/v2/product';
const TIMEOUT_MS = 12_000;

interface OffResponse {
  status?: number;
  product?: {
    product_name?: string;
    product_name_en?: string;
    brands?: string;
    quantity?: string;
    categories?: string;
    image_front_small_url?: string;
  };
}

export type BarcodeErrorCode = 'invalid' | 'network';

export class BarcodeError extends Error {
  readonly code: BarcodeErrorCode;
  constructor(code: BarcodeErrorCode) {
    super(code);
    this.name = 'BarcodeError';
    this.code = code;
  }
}

export function isPlausibleBarcode(code: string): boolean {
  return /^\d{8,14}$/.test(code.trim());
}

export async function lookupBarcode(rawCode: string, signal?: AbortSignal): Promise<BarcodeProduct | null> {
  const code = rawCode.trim();
  if (!isPlausibleBarcode(code)) {
    throw new BarcodeError('invalid');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  signal?.addEventListener('abort', () => controller.abort());

  let response: Response;
  try {
    response = await fetch(`${ENDPOINT}/${encodeURIComponent(code)}.json?fields=product_name,product_name_en,brands,quantity,categories,image_front_small_url`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'PantryChef/1.0 (personal food waste app)' },
    });
  } catch {
    throw new BarcodeError('network');
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 404) return null;
  if (!response.ok) throw new BarcodeError('network');

  const json = (await response.json()) as OffResponse;
  if (json.status !== 1 || !json.product) return null;

  const name = (json.product.product_name_en || json.product.product_name || '').trim();
  if (!name) return null;

  const categoryHint = `${name} ${json.product.categories ?? ''}`;
  return {
    code,
    name,
    brand: json.product.brands?.split(',')[0]?.trim() || undefined,
    quantity: json.product.quantity?.trim() || undefined,
    category: categorize(categoryHint),
    imageUrl: json.product.image_front_small_url,
  };
}
