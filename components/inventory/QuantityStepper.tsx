import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { colors } from '@/constants/theme';
import { t } from '@/lib/i18n';
import type { Unit } from '@/types';

interface QuantityStepperProps {
  value: number;
  unit: Unit;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}

export function QuantityStepper({ value, unit, onChange, min = 1, max = 999 }: QuantityStepperProps) {
  const canDecrement = value > min;
  const canIncrement = value < max;

  const step = (delta: number) => {
    const next = value + delta;
    if (next < min || next > max) return;
    Haptics.selectionAsync().catch(() => {});
    onChange(next);
  };

  return (
    <View className="flex-row items-center rounded-full bg-cream-100">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('row.decrease')}
        disabled={!canDecrement}
        onPress={() => step(-1)}
        hitSlop={6}
        className="h-9 w-9 items-center justify-center rounded-full active:bg-cream-200"
      >
        <Ionicons name="remove" size={18} color={canDecrement ? colors.sage700 : colors.ink400} />
      </Pressable>
      <Text
        accessibilityLabel={`${value} ${unit}`}
        className="min-w-[52px] text-center text-sm font-semibold text-ink-900"
      >
        {value} {unit}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('row.increase')}
        disabled={!canIncrement}
        onPress={() => step(1)}
        hitSlop={6}
        className="h-9 w-9 items-center justify-center rounded-full active:bg-cream-200"
      >
        <Ionicons name="add" size={18} color={canIncrement ? colors.sage700 : colors.ink400} />
      </Pressable>
    </View>
  );
}
