import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { IconName } from '@/components/ui/Button';
import { colors } from '@/constants/theme';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/Text';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <View className="flex-row rounded-full bg-cream-200 p-1" accessibilityRole="tablist">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            className={cn(
              'flex-1 flex-row items-center justify-center rounded-full py-2.5',
              selected ? 'bg-white' : 'bg-transparent',
            )}
            style={selected ? { shadowColor: '#293924', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 } : undefined}
          >
            {option.icon ? (
              <Ionicons
                name={option.icon}
                size={16}
                color={selected ? colors.sage700 : colors.ink400}
                style={{ marginRight: 6 }}
              />
            ) : null}
            <Text className={cn('text-sm font-semibold', selected ? 'text-sage-700' : 'text-ink-400')}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
