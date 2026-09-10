import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, type PersistStorage } from 'zustand/middleware';

export const STORAGE_KEYS = {
  inventory: 'pantrychef.inventory.v1',
  recipes: 'pantrychef.recipes.v1',
  settings: 'pantrychef.settings.v1',
  shopping: 'pantrychef.shopping.v1',
  stats: 'pantrychef.stats.v1',
} as const;

/**
 * AsyncStorage adapter for Zustand's persist middleware.
 * createJSONStorage returns undefined only when the underlying storage is
 * unavailable; falling back to an in-memory map keeps the app usable.
 */
export function createAsyncStorage<S>(): PersistStorage<S> {
  const storage = createJSONStorage<S>(() => AsyncStorage);
  if (storage) return storage;

  const memory = new Map<string, string>();
  return createJSONStorage<S>(() => ({
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => {
      memory.set(key, value);
    },
    removeItem: (key) => {
      memory.delete(key);
    },
  })) as PersistStorage<S>;
}
