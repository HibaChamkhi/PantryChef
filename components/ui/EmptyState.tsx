import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button, type IconName } from '@/components/ui/Button';
import { colors } from '@/constants/theme';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  message: string;
  action?: { label: string; onPress: () => void; icon?: IconName };
  className?: string;
}

export function EmptyState({ icon, title, message, action, className }: EmptyStateProps) {
  return (
    <View className={cn('items-center px-8 py-12', className)}>
      <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-sage-100">
        <Ionicons name={icon} size={36} color={colors.sage600} />
      </View>
      <Text className="mb-2 text-center text-xl font-bold text-ink-900">{title}</Text>
      <Text className="mb-6 text-center text-base leading-6 text-ink-600">{message}</Text>
      {action ? <Button title={action.label} icon={action.icon} onPress={action.onPress} /> : null}
    </View>
  );
}
