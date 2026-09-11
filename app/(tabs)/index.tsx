import { useCallback, useMemo, useRef } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { InventoryList } from '@/components/inventory/InventoryList';
import { QuickAddBar } from '@/components/inventory/QuickAddBar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { CATEGORY_META } from '@/constants/categories';
import { colors } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { daysUntil } from '@/lib/utils';
import { runRecipeGeneration } from '@/services/generation';
import { expiringSoon, sortNewestFirst, useInventoryStore } from '@/store/useInventoryStore';
import { monthlyStats, useStatsStore } from '@/store/useStatsStore';
import type { InventoryItem } from '@/types';
import { Text, TextInput } from '@/components/ui/Text';
import type { TextInput as RNTextInputType } from 'react-native';

function expiryWord(item: InventoryItem): string {
  const days = item.expiresAt ? daysUntil(item.expiresAt) : Number.POSITIVE_INFINITY;
  if (days < 0) return t('row.expired');
  if (days === 0) return t('row.useToday');
  if (days === 1) return t('row.useTomorrow');
  return t('row.useInDays', { count: days });
}

function UseItUp({ items, onCook }: { items: InventoryItem[]; onCook: () => void }) {
  if (items.length === 0) return null;
  return (
    <View className="mb-3 rounded-xl2 border border-clay-300 bg-white px-4 py-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Ionicons name="flame-outline" size={16} color={colors.clay500} />
          <Text className="ml-1.5 text-sm font-bold text-ink-900">{t('pantry.useItUp')}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={t('pantry.cookThese')} onPress={onCook} hitSlop={6} className="rounded-full bg-clay-500 px-3 py-1.5 active:opacity-80">
          <Text className="text-xs font-semibold text-white">{t('pantry.cookThese')}</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2.5" contentContainerClassName="gap-2">
        {items.map((item) => (
          <View key={item.id} className="flex-row items-center rounded-full bg-cream-100 px-3 py-1.5">
            <Text className="text-sm">{CATEGORY_META[item.category].emoji}</Text>
            <Text className="ml-1.5 text-xs font-semibold text-ink-900">{item.name}</Text>
            <Text className="ml-1.5 text-xs text-clay-600">· {expiryWord(item)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function StatsCard() {
  const events = useStatsStore((state) => state.events);
  const stats = useMemo(() => monthlyStats(events), [events]);
  const consumed = stats.used + stats.wasted;
  const percent = Math.round(stats.savedRatio * 100);

  return (
    <View className="mb-3 rounded-xl2 bg-sage-100 px-4 py-3" accessibilityLabel={`${t('stats.title')}: ${stats.used} ${t('stats.used')}, ${stats.wasted} ${t('stats.wasted')}`}>
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-bold uppercase tracking-wide text-sage-700">{t('stats.title')}</Text>
        <Text className="text-xs text-sage-700">{stats.added} {t('stats.added')}</Text>
      </View>
      <View className="mt-2 flex-row items-end gap-4">
        <View>
          <Text className="text-2xl font-bold text-sage-700">{stats.used}</Text>
          <Text className="text-xs text-ink-600">{t('stats.used')}</Text>
        </View>
        <View>
          <Text className="text-2xl font-bold text-clay-600">{stats.wasted}</Text>
          <Text className="text-xs text-ink-600">{t('stats.wasted')}</Text>
        </View>
        <View className="flex-1 pb-1">
          <View className="h-2 overflow-hidden rounded-full bg-white">
            <View className="h-full rounded-full bg-sage-500" style={{ width: `${consumed === 0 ? 0 : percent}%` }} />
          </View>
          <Text className="mt-1 text-xs leading-4 text-ink-600" numberOfLines={2}>
            {consumed === 0 ? t('stats.empty') : t('stats.saved', { percent })}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function PantryScreen() {
  const router = useRouter();
  const rawItems = useInventoryStore((state) => state.items);
  const items = useMemo(() => sortNewestFirst(rawItems), [rawItems]);
  const expiring = useMemo(() => expiringSoon(rawItems), [rawItems]);
  const addItem = useInventoryStore((state) => state.addItem);
  const setQuantity = useInventoryStore((state) => state.setQuantity);
  const removeItem = useInventoryStore((state) => state.removeItem);
  const clear = useInventoryStore((state) => state.clear);

  const inputRef = useRef<RNTextInputType>(null);

  const subtitle = useMemo(() => {
    if (items.length === 0) return t('pantry.emptySubtitle');
    const base = t('common.items', { count: items.length });
    return expiring.length > 0 ? `${base} · ${t('pantry.expiringSoon', { count: expiring.length })}` : t('pantry.readyToCook', { items: base });
  }, [items.length, expiring.length]);

  const handleAdd = useCallback(
    (name: string) => {
      addItem({ name });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    },
    [addItem],
  );

  const handleClear = useCallback(() => {
    Alert.alert(t('pantry.clearTitle'), t('pantry.clearMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('pantry.clearConfirm'), style: 'destructive', onPress: clear },
    ]);
  }, [clear]);

  const openAddItem = useCallback(() => {
    Keyboard.dismiss();
    router.push('/add-item');
  }, [router]);

  const openSettings = useCallback(() => {
    Keyboard.dismiss();
    router.push('/settings');
  }, [router]);

  const openPlan = useCallback(() => {
    Keyboard.dismiss();
    router.push('/plan');
  }, [router]);

  const generate = useCallback(() => {
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    void runRecipeGeneration();
    router.push('/recipes');
  }, [router]);

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <View className="flex-row items-start justify-between px-5 pb-3 pt-2">
          <View className="flex-1 pr-3">
            <Text className="text-3xl font-bold text-ink-900">{t('pantry.title')}</Text>
            <Text className="mt-1 text-base text-ink-600">{subtitle}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            {items.length > 0 ? (
              <Pressable accessibilityRole="button" accessibilityLabel={t('pantry.clearTitle')} onPress={handleClear} hitSlop={8} className="rounded-full px-2 py-2 active:bg-cream-200">
                <Text className="text-sm font-semibold text-ink-400">{t('common.clear')}</Text>
              </Pressable>
            ) : null}
            <Pressable accessibilityRole="button" accessibilityLabel={t('pantry.settings')} onPress={openSettings} className="h-11 w-11 items-center justify-center rounded-full bg-cream-200 active:bg-cream-300">
              <Ionicons name="settings-outline" size={22} color={colors.sage700} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={t('pantry.addItem')} onPress={openAddItem} className="h-11 w-11 items-center justify-center rounded-full bg-sage-600 active:bg-sage-700">
              <Ionicons name="add" size={26} color="#ffffff" />
            </Pressable>
          </View>
        </View>

        <QuickAddBar ref={inputRef} onAdd={handleAdd} />

        <InventoryList
          items={items}
          onSetQuantity={setQuantity}
          onRemove={removeItem}
          ListHeaderComponent={
            <View>
              <UseItUp items={expiring} onCook={generate} />
              {items.length > 0 ? <StatsCard /> : null}
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="basket-outline"
              title={t('pantry.emptyTitle')}
              message={t('pantry.emptyMessage')}
              action={{ label: t('pantry.emptyAction'), icon: 'add', onPress: openAddItem }}
            />
          }
        />
      </KeyboardAvoidingView>

      <View className="absolute inset-x-0 bottom-0 flex-row items-center gap-2.5 border-t border-cream-200 bg-cream-50/95 px-5 pb-4 pt-3">
        <View className="flex-1">
          <Button
            title={items.length === 0 ? t('pantry.generateEmpty') : t('pantry.generate')}
            icon="sparkles"
            size="lg"
            fullWidth
            disabled={items.length === 0}
            onPress={generate}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('pantry.plan')}
          onPress={openPlan}
          disabled={items.length === 0}
          className={`h-14 w-14 items-center justify-center rounded-full ${items.length === 0 ? 'bg-cream-200 opacity-50' : 'bg-sage-100 active:bg-sage-200'}`}
        >
          <Ionicons name="calendar-outline" size={24} color={colors.sage700} />
        </Pressable>
      </View>
    </Screen>
  );
}
