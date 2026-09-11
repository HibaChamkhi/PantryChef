import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { colors } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/Text';

type TimerStatus = 'idle' | 'running' | 'paused' | 'done';

interface StepTimerProps {
  durationMinutes: number;
  onComplete?: () => void;
  onRunningChange?: (running: boolean) => void;
}

const TICK_MS = 250;

function formatClock(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Countdown timer for a single recipe step. Tracks an absolute end time so it
 * stays accurate even if the JS thread is briefly paused.
 */
export function StepTimer({ durationMinutes, onComplete, onRunningChange }: StepTimerProps) {
  const totalMs = Math.max(1, durationMinutes) * 60_000;
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [remainingMs, setRemainingMs] = useState(totalMs);
  const endAtRef = useRef<number | null>(null);

  useEffect(() => {
    onRunningChange?.(status === 'running');
  }, [status, onRunningChange]);

  useEffect(() => {
    if (status !== 'running') return;

    const interval = setInterval(() => {
      const endAt = endAtRef.current;
      if (endAt === null) return;
      const left = Math.max(0, endAt - Date.now());
      setRemainingMs(left);
      if (left === 0) {
        clearInterval(interval);
        endAtRef.current = null;
        setStatus('done');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        onComplete?.();
      }
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [status, onComplete]);

  const start = useCallback(() => {
    endAtRef.current = Date.now() + remainingMs;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setStatus('running');
  }, [remainingMs]);

  const pause = useCallback(() => {
    if (endAtRef.current !== null) {
      setRemainingMs(Math.max(0, endAtRef.current - Date.now()));
    }
    endAtRef.current = null;
    setStatus('paused');
  }, []);

  const reset = useCallback(() => {
    endAtRef.current = null;
    setRemainingMs(totalMs);
    setStatus('idle');
  }, [totalMs]);

  const progress = 1 - remainingMs / totalMs;
  const isDone = status === 'done';

  return (
    <View
      className={cn('mt-3 rounded-xl2 px-4 py-3', isDone ? 'bg-sage-100' : 'bg-cream-100')}
      accessibilityLabel={`${formatClock(remainingMs)} ${t('detail.ofMinutes', { count: durationMinutes })}`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Ionicons
            name={isDone ? 'checkmark-circle' : 'timer-outline'}
            size={18}
            color={isDone ? colors.sage600 : colors.ink600}
          />
          <Text className={cn('ml-2 text-2xl font-bold tabular-nums', isDone ? 'text-sage-700' : 'text-ink-900')}>
            {isDone ? t('detail.timerDone') : formatClock(remainingMs)}
          </Text>
          <Text className="ml-2 text-xs text-ink-400">{t('detail.ofMinutes', { count: durationMinutes })}</Text>
        </View>

        <View className="flex-row items-center gap-2">
          {status !== 'idle' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('detail.reset')}
              onPress={reset}
              hitSlop={6}
              className="h-9 w-9 items-center justify-center rounded-full bg-white active:bg-cream-200"
            >
              <Ionicons name="refresh" size={18} color={colors.ink600} />
            </Pressable>
          ) : null}
          {!isDone ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={status === 'running' ? t('detail.pauseTimer') : t('detail.startTimer')}
              onPress={status === 'running' ? pause : start}
              className="h-9 flex-row items-center rounded-full bg-sage-600 px-3.5 active:bg-sage-700"
            >
              <Ionicons name={status === 'running' ? 'pause' : 'play'} size={16} color="#ffffff" />
              <Text className="ml-1.5 text-sm font-semibold text-white">
                {status === 'running' ? t('detail.pause') : status === 'paused' ? t('detail.resume') : t('detail.start')}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
        <View
          className={cn('h-full rounded-full', isDone ? 'bg-sage-500' : 'bg-clay-500')}
          style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
        />
      </View>
    </View>
  );
}
