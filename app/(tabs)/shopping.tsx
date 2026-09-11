import { useCallback, useMemo, useRef } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { QuickAddBar } from '@/components/inventory/QuickAddBar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useShoppingStore } from '@/store/useShoppingStore';
import type { ShoppingItem } from '@/types';
import { Text, TextInput } from '@/components/ui/Text';
import type { TextInput as RNTextInputType } from 'react-native';

function Row({ item, onToggle, onRemove }: { item: ShoppingItem; onToggle: (id: string) => void; onRemove: (id: string) => void }) {
  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={48}
      overshootRight={false}
      renderRightActions={() => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('row.removeLabel', { name: item.name })}
          onPress={() => onRemove(item.id)}
          className="ml-3 w-24 items-center justify-center rounded-xl2 bg-danger-500 active:opacity-80"
        >
          <Ionicons name="trash-outline" size={22} color="#ffffff" />
          <Text className="mt-1 text-xs font-semibold text-white">{t('row.remove')}</Text>
        </Pressable>
      )}
    >
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.checked }}
        accessibilityLabel={item.checked ? t('shopping.uncheck', { name: item.name }) : t('shopping.check', { name: item.name })}
        onPress={() => onToggle(item.id)}
        className="flex-row items-center rounded-xl2 bg-white px-4 py-3"
      >
        <Ionicons
          name={item.checked ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={item.checked ? colors.sage600 : colors.ink400}
        />
        <View className="ml-3 flex-1">
          <Text className={`text-base font-semibold ${item.checked ? 'text-ink-400 line-through' : 'text-ink-900'}`}>{item.name}</Text>
          <Text className="text-xs text-ink-400">
            {[item.amount, item.recipeTitle ? t('shopping.fromRecipe', { title: item.recipeTitle }) : null].filter(Boolean).join(' · ')}
          </Text>
        </View>
      </Pressable>
    </ReanimatedSwipeable>
  );
}

export default function ShoppingScreen() {
  const router = useRouter();
  const items = useShoppingStore((state) => state.items);
  const addItem = useShoppingStore((state) => state.addItem);
  const toggleChecked = useShoppingStore((state) => state.toggleChecked);
  const removeItem = useShoppingStore((state) => state.removeItem);
  const removeChecked = useShoppingStore((state) => state.removeChecked);
  const clear = useShoppingStore((state) => state.clear);
  const addToPantry = useInventoryStore((state) => state.addMany);
  const inputRef = useRef<RNTextInputType>(null);

  const sorted = useMemo(() => [...items].sort((a, b) => Number(a.checked) - Number(b.checked)), [items]);
  const checkedCount = useMemo(() => items.filter((item) => item.checked).length, [items]);
  const remaining = items.length - checkedCount;

  const handleAdd = useCallback(
    (name: string) => {
      addItem(name);
      Haptics.selectionAsync().catch(() => {});
    },
    [addItem],
  );

  const moveToPantry = useCallback(() => {
    const bought = removeChecked();
    if (bought.length === 0) return;
    addToPantry(bought.map((line) => ({ name: line.name })));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [removeChecked, addToPantry]);

  const handleClear = useCallback(() => {
    Alert.alert(t('shopping.clearTitle'), t('shopping.clearMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('shopping.clearList'), style: 'destructive', onPress: clear },
    ]);
  }, [clear]);

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <View className="flex-row items-start justify-between px-5 pb-3 pt-2">
          <View className="flex-1 pr-3">
            <Text className="text-3xl font-bold text-ink-900">{t('shopping.title')}</Text>
            <Text className="mt-1 text-base text-ink-600">
              {items.length === 0 ? t('shopping.emptySubtitle') : remaining === 0 ? t('shopping.allDone') : t('shopping.count', { count: remaining })}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            {items.length > 0 ? (
              <Pressable accessibilityRole="button" accessibilityLabel={t('shopping.clearList')} onPress={handleClear} hitSlop={8} className="rounded-full px-2 py-2 active:bg-cream-200">
                <Text className="text-sm font-semibold text-ink-400">{t('common.clear')}</Text>
              </Pressable>
            ) : null}
            <Pressable accessibilityRole="button" accessibilityLabel={t('stores.whereToBuy')} onPress={() => router.push('/stores')} className="h-11 w-11 items-center justify-center rounded-full bg-sage-600 active:bg-sage-700">
              <Ionicons name="storefront-outline" size={22} color="#ffffff" />
            </Pressable>
          </View>
        </View>

        <QuickAddBar
          ref={inputRef}
          onAdd={handleAdd}
          placeholder={t('shopping.addPlaceholder')}
          accessibilityLabel={t('shopping.addLabel')}
          buttonLabel={t('shopping.addButton')}
        />

        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Row item={item} onToggle={toggleChecked} onRemove={removeItem} />}
          ItemSeparatorComponent={() => <View className="h-2.5" />}
          ListEmptyComponent={
            <EmptyState icon="cart-outline" title={t('shopping.emptyTitle')} message={t('shopping.emptyMessage')} />
          }
          contentContainerClassName="px-5 pb-32 pt-1"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        />
      </KeyboardAvoidingView>

      {checkedCount > 0 ? (
        <View className="absolute inset-x-0 bottom-0 border-t border-cream-200 bg-cream-50/95 px-5 pb-4 pt-3">
          <Button title={t('shopping.moveToPantry', { count: checkedCount })} icon="basket-outline" size="lg" fullWidth onPress={moveToPantry} />
        </View>
      ) : null}
    </Screen>
  );
}
