import { ActivityIndicator, Pressable, Text, View, type PressableProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/constants/theme';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type IconName = keyof typeof Ionicons.glyphMap;

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  className?: string;
}

const CONTAINER: Record<ButtonVariant, string> = {
  primary: 'bg-sage-600 active:bg-sage-700',
  secondary: 'bg-sage-100 active:bg-sage-200',
  ghost: 'bg-transparent active:bg-cream-200',
  danger: 'bg-danger-100 active:bg-danger-100',
};

const LABEL: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-sage-700',
  ghost: 'text-sage-700',
  danger: 'text-danger-500',
};

const ICON_COLOR: Record<ButtonVariant, string> = {
  primary: '#ffffff',
  secondary: colors.sage700,
  ghost: colors.sage700,
  danger: colors.danger500,
};

const SIZE: Record<ButtonSize, { container: string; label: string; icon: number }> = {
  sm: { container: 'h-9 px-3 rounded-full', label: 'text-sm', icon: 16 },
  md: { container: 'h-12 px-5 rounded-full', label: 'text-base', icon: 18 },
  lg: { container: 'h-14 px-6 rounded-full', label: 'text-lg', icon: 20 },
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  className,
  accessibilityLabel,
  ...pressableProps
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const sizing = SIZE[size];

  const iconElement = icon ? (
    <Ionicons name={icon} size={sizing.icon} color={ICON_COLOR[variant]} accessibilityElementsHidden importantForAccessibility="no" />
  ) : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={cn(
        'flex-row items-center justify-center',
        sizing.container,
        CONTAINER[variant],
        fullWidth && 'w-full',
        isDisabled && 'opacity-50',
        className,
      )}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator color={ICON_COLOR[variant]} />
      ) : (
        <View className="flex-row items-center gap-2">
          {iconPosition === 'left' && iconElement}
          <Text className={cn('font-semibold', sizing.label, LABEL[variant])}>{title}</Text>
          {iconPosition === 'right' && iconElement}
        </View>
      )}
    </Pressable>
  );
}
