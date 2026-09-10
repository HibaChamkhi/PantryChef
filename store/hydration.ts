import { useEffect, useState } from 'react';

import { useInventoryStore } from './useInventoryStore';
import { useRecipeStore } from './useRecipeStore';
import { useSettingsStore } from './useSettingsStore';
import { useShoppingStore } from './useShoppingStore';
import { useStatsStore } from './useStatsStore';

/** Never block the UI on storage for longer than this. */
const HYDRATION_TIMEOUT_MS = 3000;

function allHydrated(): boolean {
  return (
    useInventoryStore.persist.hasHydrated() &&
    useRecipeStore.persist.hasHydrated() &&
    useSettingsStore.persist.hasHydrated() &&
    useShoppingStore.persist.hasHydrated() &&
    useStatsStore.persist.hasHydrated()
  );
}

/**
 * Resolves to true once every persisted store has restored from AsyncStorage,
 * or after a short timeout if storage is slow or unavailable.
 */
export function useStoresHydrated(): boolean {
  const [hydrated, setHydrated] = useState(allHydrated);

  useEffect(() => {
    if (hydrated) return;

    const check = () => {
      if (allHydrated()) setHydrated(true);
    };

    const unsubscribers = [
      useInventoryStore.persist.onFinishHydration(check),
      useRecipeStore.persist.onFinishHydration(check),
      useSettingsStore.persist.onFinishHydration(check),
      useShoppingStore.persist.onFinishHydration(check),
      useStatsStore.persist.onFinishHydration(check),
    ];
    const timeout = setTimeout(() => setHydrated(true), HYDRATION_TIMEOUT_MS);

    check();

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      clearTimeout(timeout);
    };
  }, [hydrated]);

  return hydrated;
}
