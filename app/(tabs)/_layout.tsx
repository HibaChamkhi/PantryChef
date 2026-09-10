import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/constants/theme';
import { resolveLocale, t } from '@/lib/i18n';
import { useSettingsStore } from '@/store/useSettingsStore';

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(active: IconName, inactive: IconName) {
  return function TabIcon({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) {
    return <Ionicons name={focused ? active : inactive} color={color} size={size} />;
  };
}

export default function TabsLayout() {
  const language = useSettingsStore((state) => state.language);
  const locale = resolveLocale(language);
  return (
    <Tabs
      key={locale}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.sage600,
        tabBarInactiveTintColor: colors.ink400,
        tabBarStyle: { backgroundColor: colors.cream50, borderTopColor: colors.cream200 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        sceneStyle: { backgroundColor: colors.cream50 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.pantry'), tabBarIcon: tabIcon('basket', 'basket-outline') }} />
      <Tabs.Screen name="scan" options={{ title: t('tabs.scan'), tabBarIcon: tabIcon('camera', 'camera-outline') }} />
      <Tabs.Screen name="shopping" options={{ title: t('tabs.shopping'), tabBarIcon: tabIcon('cart', 'cart-outline') }} />
      <Tabs.Screen name="saved" options={{ title: t('tabs.saved'), tabBarIcon: tabIcon('bookmark', 'bookmark-outline') }} />
    </Tabs>
  );
}
