import { View, Pressable } from 'react-native';
import type { ErrorBoundaryProps } from 'expo-router';

import { t } from '@/lib/i18n';
import { Text } from '@/components/ui/Text';

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View className="flex-1 items-center justify-center bg-cream-50 px-8">
      <Text className="mb-2 text-2xl font-bold text-ink-900">{t('errors.crashTitle')}</Text>
      <Text className="mb-6 text-center text-base text-ink-600">
        {error.message || t('errors.generic')}
      </Text>
      <Pressable
        onPress={retry}
        accessibilityRole="button"
        className="rounded-full bg-sage-600 px-6 py-3 active:bg-sage-700"
      >
        <Text className="text-base font-semibold text-white">{t('common.retry')}</Text>
      </Pressable>
    </View>
  );
}
