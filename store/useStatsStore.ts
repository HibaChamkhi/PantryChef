import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createId } from '@/lib/utils';
import { STORAGE_KEYS, createAsyncStorage } from '@/services/storage';
import type { StatEvent, StatEventType } from '@/types';

const MAX_EVENTS = 2000;

export interface StatsState {
  events: StatEvent[];
  record: (type: StatEventType, itemName: string) => void;
  clear: () => void;
}

interface PersistedStats {
  events: StatEvent[];
}

export const useStatsStore = create<StatsState>()(
  persist(
    (set) => ({
      events: [],
      record: (type, itemName) =>
        set((state) => ({
          events: [...state.events, { id: createId(), type, itemName, at: new Date().toISOString() }].slice(-MAX_EVENTS),
        })),
      clear: () => set({ events: [] }),
    }),
    {
      name: STORAGE_KEYS.stats,
      storage: createAsyncStorage<PersistedStats>(),
      partialize: (state) => ({ events: state.events }),
      version: 1,
    },
  ),
);

export interface MonthlyStats {
  added: number;
  used: number;
  wasted: number;
  /** 0..1 share of consumed items that were used rather than wasted. */
  savedRatio: number;
}

/** Counts events in the current calendar month. Call inside useMemo. */
export function monthlyStats(events: StatEvent[], now: Date = new Date()): MonthlyStats {
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const counts = { added: 0, used: 0, wasted: 0 };
  for (const event of events) {
    if (new Date(event.at).getTime() < start) continue;
    counts[event.type] += 1;
  }
  const consumed = counts.used + counts.wasted;
  return { ...counts, savedRatio: consumed === 0 ? 1 : counts.used / consumed };
}
