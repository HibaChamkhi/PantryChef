import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { IconName } from '@/components/ui/Button';
import { colors } from '@/constants/theme';
import { cn } from '@/lib/utils';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  className?: string;
}

export function Chip({ label, selected = false, onPress, icon, className }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      className={cn(
        'flex-row items-center rounded-full border px-3.5 py-2',
        selected ? 'border-sage-600 bg-sage-600' : 'border-cream-300 bg-white active:bg-cream-100',
        className,
      )}
    >
      {icon ? (
        <Ionicons name={icon} size={14} color={selected ? '#ffffff' : colors.ink600} style={{ marginRight: 6 }} />
      ) : null}
      <Text className={cn('text-sm font-semibold', selected ? 'text-white' : 'text-ink-600')}>{label}</Text>
    </Pressable>
  );
}
