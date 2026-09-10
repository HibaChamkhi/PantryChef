import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createId, normalizeName } from '@/lib/utils';
import { STORAGE_KEYS, createAsyncStorage } from '@/services/storage';
import type { ShoppingItem } from '@/types';

export interface ShoppingState {
  items: ShoppingItem[];
  addItem: (name: string, amount?: string, recipeTitle?: string) => ShoppingItem | null;
  addMany: (lines: Array<{ name: string; amount?: string; recipeTitle?: string }>) => number;
  toggleChecked: (id: string) => void;
  removeItem: (id: string) => void;
  removeChecked: () => ShoppingItem[];
  clear: () => void;
}

interface PersistedShopping {
  items: ShoppingItem[];
}

export const useShoppingStore = create<ShoppingState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (rawName, amount, recipeTitle) => {
        const name = normalizeName(rawName);
        if (!name) return null;
        const existing = get().items.find((item) => item.name.toLowerCase() === name.toLowerCase());
        if (existing) return existing;
        const item: ShoppingItem = {
          id: createId(),
          name,
          amount: amount?.trim() || undefined,
          checked: false,
          recipeTitle,
          addedAt: new Date().toISOString(),
        };
        set((state) => ({ items: [...state.items, item] }));
        return item;
      },

      addMany: (lines) => {
        let added = 0;
        for (const line of lines) {
          const before = get().items.length;
          get().addItem(line.name, line.amount, line.recipeTitle);
          if (get().items.length > before) added += 1;
        }
        return added;
      },

      toggleChecked: (id) =>
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)),
        })),

      removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),

      removeChecked: () => {
        const checked = get().items.filter((item) => item.checked);
        set((state) => ({ items: state.items.filter((item) => !item.checked) }));
        return checked;
      },

      clear: () => set({ items: [] }),
    }),
    {
      name: STORAGE_KEYS.shopping,
      storage: createAsyncStorage<PersistedShopping>(),
      partialize: (state) => ({ items: state.items }),
      version: 1,
    },
  ),
);
