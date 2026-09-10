import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_KEYS, createAsyncStorage } from '@/services/storage';
import type { Allergen, Cuisine, Diet, Language, RecipePreferences } from '@/types';

export interface SettingsState {
  diet: Diet;
  allergens: Allergen[];
  customAvoid: string[];
  language: Language;
  remindersEnabled: boolean;
  /** Hour of day (0-23) for expiry reminders. */
  reminderHour: number;
  /** Result-screen filters; not persisted. */
  cuisine: Cuisine;
  maxMinutes: number | null;

  setDiet: (diet: Diet) => void;
  toggleAllergen: (allergen: Allergen) => void;
  addCustomAvoid: (value: string) => void;
  removeCustomAvoid: (value: string) => void;
  setLanguage: (language: Language) => void;
  setRemindersEnabled: (enabled: boolean) => void;
  setReminderHour: (hour: number) => void;
  setCuisine: (cuisine: Cuisine) => void;
  setMaxMinutes: (minutes: number | null) => void;
}

interface PersistedSettings {
  diet: Diet;
  allergens: Allergen[];
  customAvoid: string[];
  language: Language;
  remindersEnabled: boolean;
  reminderHour: number;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      diet: 'none',
      allergens: [],
      customAvoid: [],
      language: 'system',
      remindersEnabled: false,
      reminderHour: 9,
      cuisine: 'any',
      maxMinutes: null,

      setDiet: (diet) => set({ diet }),
      toggleAllergen: (allergen) =>
        set((state) => ({
          allergens: state.allergens.includes(allergen)
            ? state.allergens.filter((item) => item !== allergen)
            : [...state.allergens, allergen],
        })),
      addCustomAvoid: (value) =>
        set((state) => {
          const clean = value.trim().toLowerCase();
          if (!clean || state.customAvoid.includes(clean)) return state;
          return { customAvoid: [...state.customAvoid, clean] };
        }),
      removeCustomAvoid: (value) =>
        set((state) => ({ customAvoid: state.customAvoid.filter((item) => item !== value) })),
      setLanguage: (language) => set({ language }),
      setRemindersEnabled: (remindersEnabled) => set({ remindersEnabled }),
      setReminderHour: (reminderHour) => set({ reminderHour: Math.min(23, Math.max(0, Math.round(reminderHour))) }),
      setCuisine: (cuisine) => set({ cuisine }),
      setMaxMinutes: (maxMinutes) => set({ maxMinutes }),
    }),
    {
      name: STORAGE_KEYS.settings,
      storage: createAsyncStorage<PersistedSettings>(),
      partialize: (state) => ({
        diet: state.diet,
        allergens: state.allergens,
        customAvoid: state.customAvoid,
        language: state.language,
        remindersEnabled: state.remindersEnabled,
        reminderHour: state.reminderHour,
      }),
      version: 1,
    },
  ),
);

/** Builds the preference object passed to every recipe generator. */
export function selectPreferences(state: SettingsState): RecipePreferences {
  return {
    diet: state.diet,
    avoid: [...state.allergens, ...state.customAvoid],
    cuisine: state.cuisine,
    maxMinutes: state.maxMinutes,
  };
}
