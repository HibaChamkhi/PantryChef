import '../global.css';

import { useEffect, useMemo, useRef } from 'react';
import { Alert, I18nManager } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import { applyLocale, isRtlLocale, resolveLocale, t } from '@/lib/i18n';
import { syncExpiryReminders } from '@/services/notifications';
import { useStoresHydrated } from '@/store/hydration';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useSettingsStore } from '@/store/useSettingsStore';

export { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden or unavailable (web); safe to ignore.
});

/** Keeps expiry reminders in sync with the pantry and the reminder settings. */
function useExpiryReminders(enabled: boolean) {
  const items = useInventoryStore((state) => state.items);
  const remindersEnabled = useSettingsStore((state) => state.remindersEnabled);
  const reminderHour = useSettingsStore((state) => state.reminderHour);

  useEffect(() => {
    if (!enabled) return;
    syncExpiryReminders(items, remindersEnabled, reminderHour).catch(() => {});
  }, [enabled, items, remindersEnabled, reminderHour]);
}

export default function RootLayout() {
  const hydrated = useStoresHydrated();
  const language = useSettingsStore((state) => state.language);
  const locale = useMemo(() => resolveLocale(language), [language]);
  const rtlWarned = useRef(false);

  // Apply synchronously so every t() call in this render uses the right locale.
  applyLocale(locale);

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [hydrated]);

  // Direction actually in effect for this launch, and the value last written
  // to the native flag (which only applies on the next launch).
  const forcedRtl = useRef<boolean>(I18nManager.isRTL);

  useEffect(() => {
    if (!hydrated) return;
    const wantRtl = isRtlLocale(locale);
    if (forcedRtl.current !== wantRtl) {
      I18nManager.allowRTL(wantRtl);
      I18nManager.forceRTL(wantRtl);
      forcedRtl.current = wantRtl;
    }
    // Tell the user once when the visible layout does not match the language.
    if (I18nManager.isRTL !== wantRtl && !rtlWarned.current) {
      rtlWarned.current = true;
      Alert.alert(t('settings.language'), t('settings.languageHint'));
    }
  }, [hydrated, locale]);

  useExpiryReminders(hydrated);

  // Keep the native splash screen up until persisted state is restored,
  // so the pantry never flashes empty before its items appear.
  if (!hydrated) return null;

  // Mirror the layout immediately for Arabic. The native flag set above makes
  // the system header follow on the next launch.
  const direction = isRtlLocale(locale) ? 'rtl' : 'ltr';

  return (
    <GestureHandlerRootView style={{ flex: 1, direction }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.cream50 },
            headerTintColor: colors.sage700,
            headerTitleStyle: { fontWeight: '700', color: colors.ink900 },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.cream50 },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="add-item" options={{ presentation: 'modal', title: t('addItem.title'), headerShadowVisible: false }} />
          <Stack.Screen name="barcode" options={{ presentation: 'modal', title: t('barcode.title'), headerShadowVisible: false }} />
          <Stack.Screen name="settings" options={{ presentation: 'modal', title: t('settings.title'), headerShadowVisible: false }} />
          <Stack.Screen name="plan" options={{ title: t('plan.title'), headerBackTitle: t('tabs.pantry') }} />
          <Stack.Screen name="stores" options={{ title: t('stores.title'), headerBackTitle: t('tabs.shopping') }} />
          <Stack.Screen name="recipes/index" options={{ title: t('recipes.title'), headerBackTitle: t('tabs.pantry') }} />
          <Stack.Screen name="recipes/[id]" options={{ title: '', headerBackTitle: t('recipes.title') }} />
          <Stack.Screen name="+not-found" options={{ title: t('detail.notFoundTitle') }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
