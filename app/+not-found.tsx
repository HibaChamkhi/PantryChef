import { View, Text } from 'react-native';
import { Link } from 'expo-router';

import { t } from '@/lib/i18n';

export default function NotFoundScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-cream-50 px-8">
      <Text className="mb-2 text-2xl font-bold text-ink-900">Nothing on this shelf</Text>
      <Text className="mb-6 text-center text-base text-ink-600">
        The screen you were looking for does not exist.
      </Text>
      <Link
        href="/"
        className="rounded-full bg-sage-600 px-6 py-3 text-base font-semibold text-white"
      >
        {t('detail.backToPantry')}
      </Link>
    </View>
  );
}
