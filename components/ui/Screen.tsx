import type { ReactNode } from 'react';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { cn } from '@/lib/utils';

interface ScreenProps {
  children: ReactNode;
  /** Which safe-area edges to pad. Tabs screens only need the top. */
  edges?: Edge[];
  className?: string;
}

export function Screen({ children, edges = ['top'], className }: ScreenProps) {
  return (
    <SafeAreaView edges={edges} className={cn('flex-1 bg-cream-50', className)}>
      {children}
    </SafeAreaView>
  );
}
