import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';

import { RecipeCard } from '@/components/recipes/RecipeCard';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { recipeSource } from '@/services/ai';
import { cancelRecipeGeneration, runRecipeGeneration } from '@/services/generation';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useRecipeStore } from '@/store/useRecipeStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { CUISINES, type Recipe } from '@/types';
import { Text } from '@/components/ui/Text';

const TIME_OPTIONS: Array<{ key: 'anyTime' | 'under30' | 'under60'; minutes: number | null }> = [
  { key: 'anyTime', minutes: null },
  { key: 'under30', minutes: 30 },
  { key: 'under60', minutes: 60 },
];

function ThinkingState({ onCancel }: { onCancel: () => void }) {
  const messages = useMemo(() => [t('recipes.thinking1'), t('recipes.thinking2'), t('recipes.thinking3'), t('recipes.thinking4')], []);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setIndex((value) => (value + 1) % messages.length), 2200);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-sage-100">
        <ActivityIndicator size="large" color={colors.sage600} />
      </View>
      <Text className="text-xl font-bold text-ink-900">{t('recipes.thinking')}</Text>
      <Text className="mt-2 text-center text-base text-ink-600">{messages[index]}</Text>
      <View className="mt-8">
        <Button title={t('common.cancel')} variant="ghost" onPress={onCancel} />
      </View>
    </View>
  );
}

export default function RecipesScreen() {
  const router = useRouter();
  const items = useInventoryStore((state) => state.items);
  const generated = useRecipeStore((state) => state.generated);
  const status = useRecipeStore((state) => state.status);
  const error = useRecipeStore((state) => state.error);
  const saved = useRecipeStore((state) => state.saved);
  const toggleSaved = useRecipeStore((state) => state.toggleSaved);
  const cuisine = useSettingsStore((state) => state.cuisine);
  const maxMinutes = useSettingsStore((state) => state.maxMinutes);
  const diet = useSettingsStore((state) => state.diet);
  const allergens = useSettingsStore((state) => state.allergens);
  const customAvoid = useSettingsStore((state) => state.customAvoid);
  const setCuisine = useSettingsStore((state) => state.setCuisine);
  const setMaxMinutes = useSettingsStore((state) => state.setMaxMinutes);

  const savedIds = useMemo(() => new Set(saved.map((recipe) => recipe.id)), [saved]);
  const source = recipeSource();

  useEffect(() => {
    if (status === 'idle') void runRecipeGeneration();
  }, [status]);

  const regenerate = useCallback(() => {
    void runRecipeGeneration();
  }, []);

  const changeTime = useCallback(
    (minutes: number | null) => {
      setMaxMinutes(minutes);
      void runRecipeGeneration();
    },
    [setMaxMinutes],
  );

  const changeCuisine = useCallback(
    (value: (typeof CUISINES)[number]) => {
      setCuisine(value);
      void runRecipeGeneration();
    },
    [setCuisine],
  );

  const cancel = useCallback(() => {
    cancelRecipeGeneration();
    useRecipeStore.getState().resetGeneration();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);

  const openRecipe = useCallback((recipe: Recipe) => router.push(`/recipes/${recipe.id}`), [router]);

  const usingNames = useMemo(() => {
    const names = items.slice(0, 4).map((item) => item.name.toLowerCase());
    const rest = items.length - names.length;
    return rest > 0 ? t('recipes.andMore', { names: names.join(', '), count: rest }) : names.join(', ');
  }, [items]);

  const respecting = useMemo(() => {
    const parts = [
      diet !== 'none' ? t(`settings.diets.${diet}`) : null,
      ...allergens.map((allergen) => t(`settings.allergens.${allergen}`)),
      ...customAvoid,
    ].filter(Boolean) as string[];
    return parts.length > 0 ? t('recipes.respecting', { list: parts.join(', ') }) : t('recipes.noDiet');
  }, [diet, allergens, customAvoid]);

  const filters = (
    <View className="mb-1">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-5">
        {TIME_OPTIONS.map((option) => (
          <Chip key={option.key} label={t(`recipes.${option.key}`)} icon="time-outline" selected={maxMinutes === option.minutes} onPress={() => changeTime(option.minutes)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2" contentContainerClassName="gap-2 pr-5">
        {CUISINES.map((option) => (
          <Chip key={option} label={t(`cuisines.${option}`)} selected={cuisine === option} onPress={() => changeCuisine(option)} />
        ))}
      </ScrollView>
    </View>
  );

  const header = (
    <View className="pb-3">
      <Text className="text-2xl font-bold text-ink-900">{t('recipes.ideasTitle')}</Text>
      <Text className="mt-1 text-sm leading-5 text-ink-600">{t('recipes.using', { names: usingNames })}</Text>
      <View className="mt-3 flex-row flex-wrap gap-2">
        <View className="flex-row items-center rounded-full bg-cream-200 px-3 py-1.5">
          <Ionicons name={source === 'claude' ? 'sparkles' : 'home-outline'} size={13} color={colors.ink600} />
          <Text className="ml-1.5 text-xs font-medium text-ink-600">{source === 'claude' ? t('recipes.byClaude') : t('recipes.offline')}</Text>
        </View>
        <View className="flex-row items-center rounded-full bg-sage-100 px-3 py-1.5">
          <Ionicons name="leaf-outline" size={13} color={colors.sage700} />
          <Text className="ml-1.5 text-xs font-medium text-sage-700">{respecting}</Text>
        </View>
      </View>
      <View className="mt-3">{filters}</View>
    </View>
  );

  return (
    <Screen edges={[]}>
      <Stack.Screen
        options={{
          title: t('recipes.title'),
          headerRight: () =>
            status === 'loading' ? null : (
              <Pressable accessibilityRole="button" accessibilityLabel={t('recipes.regenerate')} onPress={regenerate} hitSlop={8}>
                <Ionicons name="refresh" size={22} color={colors.sage700} />
              </Pressable>
            ),
        }}
      />

      {status === 'loading' || status === 'idle' ? (
        <ThinkingState onCancel={cancel} />
      ) : status === 'error' ? (
        <View className="flex-1 justify-center">
          <EmptyState icon="alert-circle-outline" title={t('recipes.snagTitle')} message={error ?? t('recipes.snagMessage')} action={{ label: t('common.retry'), icon: 'refresh', onPress: regenerate }} />
        </View>
      ) : (
        <FlatList
          data={generated}
          keyExtractor={(recipe) => recipe.id}
          renderItem={({ item }) => <RecipeCard recipe={item} saved={savedIds.has(item.id)} onToggleSave={toggleSaved} onPress={openRecipe} />}
          ItemSeparatorComponent={() => <View className="h-3" />}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <EmptyState icon="restaurant-outline" title={t('recipes.noRecipesTitle')} message={t('recipes.noRecipesMessage')} action={{ label: t('recipes.generateAgain'), icon: 'refresh', onPress: regenerate }} />
          }
          contentContainerClassName="px-5 pb-10 pt-4"
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}
