import { getLocales } from 'expo-localization';

/**
 * Nearby supermarkets from OpenStreetMap (Overpass API, keyless) and a small
 * catalogue of online grocers chosen by the device region.
 */

export interface NearbyStore {
  id: string;
  name: string;
  brand?: string;
  latitude: number;
  longitude: number;
  /** Metres from the search origin. */
  distance: number;
  address?: string;
  openingHours?: string;
  phone?: string;
  website?: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

const OVERPASS_ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://lz4.overpass-api.de/api/interpreter'];
const RADIUS_METRES = 3000;
const TIMEOUT_MS = 40_000;

export class StoresError extends Error {
  readonly code: 'network' | 'empty';
  constructor(code: 'network' | 'empty') {
    super(code);
    this.name = 'StoresError';
    this.code = code;
  }
}

/** Great-circle distance in metres. */
export function distanceBetween(a: Coordinates, b: Coordinates): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earth = 6_371_000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earth * Math.asin(Math.sqrt(h));
}

export function formatDistance(metres: number): string {
  return metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${Math.round(metres)} m`;
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function buildQuery(origin: Coordinates): string {
  const around = `around:${RADIUS_METRES},${origin.latitude},${origin.longitude}`;
  return `[out:json][timeout:35];(node["shop"~"^(supermarket|grocery|convenience|greengrocer)$"](${around});way["shop"~"^(supermarket|grocery|convenience|greengrocer)$"](${around}););out center tags 40;`;
}

function toStore(element: OverpassElement, origin: Coordinates): NearbyStore | null {
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;
  if (latitude === undefined || longitude === undefined) return null;
  const tags = element.tags ?? {};
  const name = tags.name || tags.brand || tags['name:en'];
  if (!name) return null;
  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
  const address = [street, tags['addr:city']].filter(Boolean).join(', ');
  return {
    id: `${element.type}/${element.id}`,
    name,
    brand: tags.brand,
    latitude,
    longitude,
    distance: distanceBetween(origin, { latitude, longitude }),
    address: address || undefined,
    openingHours: tags.opening_hours,
    phone: tags.phone || tags['contact:phone'],
    website: tags.website || tags['contact:website'],
  };
}

export async function findNearbyStores(origin: Coordinates, signal?: AbortSignal): Promise<NearbyStore[]> {
  const query = buildQuery(origin);
  let lastError: unknown = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    signal?.addEventListener('abort', () => controller.abort());
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = (await response.json()) as { elements?: OverpassElement[] };
      const stores = (json.elements ?? [])
        .map((element) => toStore(element, origin))
        .filter((store): store is NearbyStore => store !== null)
        .sort((a, b) => a.distance - b.distance);
      // De-duplicate by name + rounded position (OSM often has node and way twins).
      const seen = new Set<string>();
      return stores.filter((store) => {
        const key = `${store.name.toLowerCase()}|${store.latitude.toFixed(4)}|${store.longitude.toFixed(4)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    } catch (error) {
      lastError = error;
      console.log('[stores] overpass request failed', endpoint, error instanceof Error ? `${error.name}: ${error.message}` : error);
      if (signal?.aborted) throw error;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error ? new StoresError('network') : new StoresError('network');
}

/* -------------------------------- Online shops ------------------------------ */

export interface OnlineStore {
  id: string;
  name: string;
  /** URL to open; %s is replaced with the encoded search term when present. */
  url: string;
  regions: string[] | 'all';
}

const ONLINE_STORES: OnlineStore[] = [
  { id: 'google', name: 'Google Shopping', url: 'https://www.google.com/search?tbm=shop&q=%s', regions: 'all' },
  { id: 'amazon', name: 'Amazon', url: 'https://www.amazon.com/s?k=%s', regions: 'all' },
  { id: 'glovo-tn', name: 'Glovo', url: 'https://glovoapp.com/tn/', regions: ['TN'] },
  { id: 'carrefour-tn', name: 'Carrefour Tunisie', url: 'https://www.carrefour.tn/', regions: ['TN'] },
  { id: 'monoprix-tn', name: 'Monoprix Tunisie', url: 'https://www.monoprix.tn/', regions: ['TN'] },
  { id: 'carrefour-fr', name: 'Carrefour', url: 'https://www.carrefour.fr/s?q=%s', regions: ['FR'] },
  { id: 'auchan-fr', name: 'Auchan', url: 'https://www.auchan.fr/recherche?text=%s', regions: ['FR'] },
  { id: 'tesco-gb', name: 'Tesco', url: 'https://www.tesco.com/groceries/en-GB/search?query=%s', regions: ['GB'] },
  { id: 'sainsburys-gb', name: "Sainsbury's", url: 'https://www.sainsburys.co.uk/gol-ui/SearchResults/%s', regions: ['GB'] },
  { id: 'walmart-us', name: 'Walmart', url: 'https://www.walmart.com/search?q=%s', regions: ['US'] },
  { id: 'instacart-us', name: 'Instacart', url: 'https://www.instacart.com/store/s?k=%s', regions: ['US', 'CA'] },
  { id: 'rewe-de', name: 'REWE', url: 'https://shop.rewe.de/productList?search=%s', regions: ['DE'] },
  { id: 'coles-au', name: 'Coles', url: 'https://www.coles.com.au/search/products?q=%s', regions: ['AU'] },
];

export function deviceRegion(): string {
  return (getLocales()[0]?.regionCode ?? '').toUpperCase();
}

/** Region-specific stores first, then the global fallbacks. */
export function onlineStoresForRegion(region: string = deviceRegion()): OnlineStore[] {
  const local = ONLINE_STORES.filter((store) => store.regions !== 'all' && store.regions.includes(region));
  const global = ONLINE_STORES.filter((store) => store.regions === 'all');
  return [...local, ...global];
}

export function storeSearchUrl(store: OnlineStore, term: string): string {
  return store.url.includes('%s') ? store.url.replace('%s', encodeURIComponent(term)) : store.url;
}
