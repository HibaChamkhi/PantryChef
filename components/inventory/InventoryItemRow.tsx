import { memo, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

import { QuantityStepper } from '@/components/inventory/QuantityStepper';
import { CATEGORY_META, categoryLabel } from '@/constants/categories';
import { colors } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { daysUntil, formatRelativeDate } from '@/lib/utils';
import type { InventoryItem } from '@/types';

interface InventoryItemRowProps {
  item: InventoryItem;
  onSetQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

function expiryLabel(expiresAt: string | undefined): { text: string; urgent: boolean } | null {
  if (!expiresAt) return null;
  const days = daysUntil(expiresAt);
  if (!Number.isFinite(days)) return null;
  if (days < 0) return { text: t('row.expired'), urgent: true };
  if (days === 0) return { text: t('row.useToday'), urgent: true };
  if (days === 1) return { text: t('row.useTomorrow'), urgent: true };
  if (days <= 3) return { text: t('row.useInDays', { count: days }), urgent: true };
  return { text: t('row.goodForDays', { count: days }), urgent: false };
}

function InventoryItemRowComponent({ item, onSetQuantity, onRemove }: InventoryItemRowProps) {
  const swipeableRef = useRef<SwipeableMethods>(null);
  const meta = CATEGORY_META[item.category];
  const expiry = expiryLabel(item.expiresAt);

  const handleRemove = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    swipeableRef.current?.close();
    onRemove(item.id);
  };

  const renderRightActions = () => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('row.removeLabel', { name: item.name })}
      onPress={handleRemove}
      className="ml-3 w-24 items-center justify-center rounded-xl2 bg-danger-500 active:opacity-80"
    >
      <Ionicons name="trash-outline" size={22} color="#ffffff" />
      <Text className="mt-1 text-xs font-semibold text-white">{t('row.remove')}</Text>
    </Pressable>
  );

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      friction={2}
      rightThreshold={48}
      overshootRight={false}
      renderRightActions={renderRightActions}
    >
      <View className="flex-row items-center rounded-xl2 bg-white px-4 py-3">
        <View
          className="mr-3 h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: meta.tint }}
        >
          <Text className="text-xl">{meta.emoji}</Text>
        </View>

        <View className="flex-1 pr-3">
          <Text className="text-base font-semibold text-ink-900" numberOfLines={1}>
            {item.name}
          </Text>
          <View className="mt-0.5 flex-row flex-wrap items-center">
            <Text className="text-xs text-ink-400">
              {categoryLabel(item.category)} · {formatRelativeDate(item.addedAt)}
            </Text>
            {expiry ? (
              <Text
                className="text-xs font-semibold"
                style={{ color: expiry.urgent ? colors.clay500 : colors.sage600 }}
              >
                {'  '}· {expiry.text}
              </Text>
            ) : null}
          </View>
        </View>

        <QuantityStepper
          value={item.quantity}
          unit={item.unit}
          onChange={(next) => onSetQuantity(item.id, next)}
        />
      </View>
    </ReanimatedSwipeable>
  );
}

export const InventoryItemRow = memo(InventoryItemRowComponent);
