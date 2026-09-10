import { ActivityIndicator, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

/** Full-screen translucent spinner for blocking operations like AI generation. */
export function LoadingOverlay({ visible, message }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={message ?? 'Loading'}
      className="absolute inset-0 items-center justify-center bg-cream-50/90"
    >
      <View className="items-center rounded-xl2 bg-white px-8 py-6" style={{ elevation: 4 }}>
        <ActivityIndicator size="large" color={colors.sage600} />
        {message ? <Text className="mt-4 text-base font-medium text-ink-600">{message}</Text> : null}
      </View>
    </View>
  );
}
