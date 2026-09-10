import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

import { cn } from '@/lib/utils';

interface CardProps extends ViewProps {
  children: ReactNode;
  className?: string;
}

const SHADOW = {
  shadowColor: '#293924',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;

export function Card({ children, className, style, ...viewProps }: CardProps) {
  return (
    <View className={cn('rounded-xl2 bg-white p-4', className)} style={[SHADOW, style]} {...viewProps}>
      {children}
    </View>
  );
}
