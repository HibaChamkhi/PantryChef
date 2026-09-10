import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { StepTimer } from '@/components/recipes/StepTimer';
import { colors } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { RecipeStep } from '@/types';

interface StepCardProps {
  step: RecipeStep;
  done: boolean;
  onToggleDone: (order: number) => void;
  onTimerComplete?: (order: number) => void;
}

function StepCardComponent({ step, done, onToggleDone, onTimerComplete }: StepCardProps) {
  return (
    <View className={cn('rounded-xl2 bg-white p-4', done && 'opacity-60')}>
      <View className="flex-row items-start">
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: done }}
          accessibilityLabel={`Step ${step.order}`}
          onPress={() => onToggleDone(step.order)}
          hitSlop={8}
          className={cn(
            'mr-3 h-8 w-8 items-center justify-center rounded-full',
            done ? 'bg-sage-600' : 'bg-sage-100',
          )}
        >
          {done ? (
            <Ionicons name="checkmark" size={18} color="#ffffff" />
          ) : (
            <Text className="text-sm font-bold text-sage-700">{step.order}</Text>
          )}
        </Pressable>
        <Text className={cn('flex-1 text-base leading-6 text-ink-900', done && 'line-through')}>
          {step.instruction}
        </Text>
      </View>

      {step.durationMinutes ? (
        <StepTimer
          durationMinutes={step.durationMinutes}
          onComplete={onTimerComplete ? () => onTimerComplete(step.order) : undefined}
        />
      ) : null}

      {step.durationMinutes ? null : (
        <View className="mt-2 flex-row items-center pl-11">
          <Ionicons name="flash-outline" size={12} color={colors.ink400} />
          <Text className="ml-1 text-xs text-ink-400">{t('detail.noTimer')}</Text>
        </View>
      )}
    </View>
  );
}

export const StepCard = memo(StepCardComponent);
