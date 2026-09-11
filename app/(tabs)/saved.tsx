import { useCallback } from 'react';
import { FlatList, View } from 'react-native';
import { useRouter } from 'expo-router';

import { RecipeCard } from '@/components/recipes/RecipeCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { t } from '@/lib/i18n';
import { useRecipeStore } from '@/store/useRecipeStore';
import type { Recipe } from '@/types';
import { Text } from '@/components/ui/Text';

export default function SavedScreen() {
  const saved = useRecipeStore((state) => state.saved);
  const toggleSaved = useRecipeStore((state) => state.toggleSaved);
  const router = useRouter();

  const handleToggle = useCallback((recipe: Recipe) => toggleSaved(recipe), [toggleSaved]);

  return (
    <Screen>
      <View className="px-5 pb-3 pt-2">
        <Text className="text-3xl font-bold text-ink-900">{t('saved.title')}</Text>
        <Text className="mt-1 text-base text-ink-600">
          {saved.length === 0 ? t('saved.emptySubtitle') : t('common.recipes', { count: saved.length })}
        </Text>
      </View>

      <FlatList
        data={saved}
        keyExtractor={(recipe) => recipe.id}
        renderItem={({ item }) => (
          <RecipeCard recipe={item} saved onToggleSave={handleToggle} onPress={(recipe) => router.push(`/recipes/${recipe.id}`)} />
        )}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListEmptyComponent={
          <EmptyState
            icon="bookmark-outline"
            title={t('saved.emptyTitle')}
            message={t('saved.emptyMessage')}
            action={{
              label: t('saved.goToPantry'),
              icon: 'basket-outline',
              onPress: () => router.navigate('/'),
            }}
          />
        }
        contentContainerClassName="px-5 pb-8 pt-1"
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}
