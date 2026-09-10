import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { categorize } from '@/lib/categorize';
import { createId, daysUntil, normalizeName } from '@/lib/utils';
import { STORAGE_KEYS, createAsyncStorage } from '@/services/storage';
import { useStatsStore } from '@/store/useStatsStore';
import type { InventoryItem, NewInventoryItem } from '@/types';

export interface InventoryState {
  items: InventoryItem[];
  /** Adds an item, or bumps the quantity when the same name + unit already exists. */
  addItem: (input: NewInventoryItem) => InventoryItem;
  addMany: (inputs: NewInventoryItem[]) => InventoryItem[];
  updateItem: (id: string, patch: Partial<Omit<InventoryItem, 'id'>>) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  /** Removes items that were cooked and eaten, counting them as saved from waste. */
  consume: (ids: string[]) => void;
  clear: () => void;
}

interface PersistedInventory {
  items: InventoryItem[];
}

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 999;

function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return MIN_QUANTITY;
  return Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, Math.round(value)));
}

function buildItem(input: NewInventoryItem, name: string): InventoryItem {
  return {
    id: createId(),
    name,
    quantity: clampQuantity(input.quantity ?? 1),
    unit: input.unit ?? 'pcs',
    category: input.category ?? categorize(name),
    addedAt: new Date().toISOString(),
    expiresAt: input.expiresAt,
  };
}

function upsert(items: InventoryItem[], input: NewInventoryItem): { items: InventoryItem[]; item: InventoryItem } {
  const name = normalizeName(input.name);
  const unit = input.unit ?? 'pcs';
  const existingIndex = items.findIndex(
    (candidate) => candidate.name.toLowerCase() === name.toLowerCase() && candidate.unit === unit,
  );

  if (existingIndex >= 0) {
    const existing = items[existingIndex];
    const merged: InventoryItem = {
      ...existing,
      quantity: clampQuantity(existing.quantity + (input.quantity ?? 1)),
      expiresAt: input.expiresAt ?? existing.expiresAt,
    };
    const next = [...items];
    next[existingIndex] = merged;
    return { items: next, item: merged };
  }

  const item = buildItem(input, name);
  return { items: [...items, item], item };
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (input) => {
        const before = get().items.length;
        const result = upsert(get().items, input);
        set({ items: result.items });
        if (result.items.length > before) useStatsStore.getState().record('added', result.item.name);
        return result.item;
      },

      addMany: (inputs) => {
        let items = get().items;
        const added: InventoryItem[] = [];
        for (const input of inputs) {
          if (!normalizeName(input.name)) continue;
          const before = items.length;
          const result = upsert(items, input);
          items = result.items;
          added.push(result.item);
          if (items.length > before) useStatsStore.getState().record('added', result.item.name);
        }
        set({ items });
        return added;
      },

      updateItem: (id, patch) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...patch,
                  name: patch.name !== undefined ? normalizeName(patch.name) || item.name : item.name,
                  quantity: patch.quantity !== undefined ? clampQuantity(patch.quantity) : item.quantity,
                }
              : item,
          ),
        })),

      setQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: clampQuantity(quantity) } : item,
          ),
        })),

      removeItem: (id) => {
        const item = get().items.find((candidate) => candidate.id === id);
        if (item?.expiresAt && daysUntil(item.expiresAt) < 0) {
          useStatsStore.getState().record('wasted', item.name);
        }
        set((state) => ({ items: state.items.filter((candidate) => candidate.id !== id) }));
      },

      consume: (ids) => {
        const chosen = new Set(ids);
        const stats = useStatsStore.getState();
        for (const item of get().items) {
          if (chosen.has(item.id)) stats.record('used', item.name);
        }
        set((state) => ({ items: state.items.filter((item) => !chosen.has(item.id)) }));
      },

      clear: () => set({ items: [] }),
    }),
    {
      name: STORAGE_KEYS.inventory,
      storage: createAsyncStorage<PersistedInventory>(),
      partialize: (state) => ({ items: state.items }),
      version: 1,
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn('[inventory] failed to restore from storage', error);
        }
      },
    },
  ),
);

/**
 * Derivation helpers. They return new arrays, so call them inside useMemo
 * rather than passing them as store selectors (a selector must return a
 * stable reference or React will re-render forever).
 */
export function sortNewestFirst(items: InventoryItem[]): InventoryItem[] {
  return [...items].sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

/** Items expiring within the next 3 days (or already expired). */
export function expiringSoon(items: InventoryItem[]): InventoryItem[] {
  return items.filter((item) => item.expiresAt !== undefined && daysUntil(item.expiresAt) <= 3);
}
