import { useCallback, useMemo } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';

import { RecipeCard } from '@/components/recipes/RecipeCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/constants/theme';
import { currentLocale, dayName, t } from '@/lib/i18n';
import { cancelWeeklyPlan, runWeeklyPlan } from '@/services/generation';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useRecipeStore } from '@/store/useRecipeStore';
import { useShoppingStore } from '@/store/useShoppingStore';
import type { Recipe } from '@/types';

export default function PlanScreen() {
  const router = useRouter();
  const plan = useRecipeStore((state) => state.plan);
  const status = useRecipeStore((state) => state.planStatus);
  const error = useRecipeStore((state) => state.planError);
  const saved = useRecipeStore((state) => state.saved);
  const toggleSaved = useRecipeStore((state) => state.toggleSaved);
  const pantryCount = useInventoryStore((state) => state.items.length);
  const addToShopping = useShoppingStore((state) => state.addMany);

  const savedIds = useMemo(() => new Set(saved.map((recipe) => recipe.id)), [saved]);

  const missing = useMemo(() => {
    if (!plan) return [];
    const seen = new Set<string>();
    const lines: Array<{ name: string; amount?: string; recipeTitle?: string }> = [];
    for (const day of plan.days) {
      for (const ingredient of day.recipe.ingredients) {
        const key = ingredient.name.toLowerCase();
        if (ingredient.inPantry || seen.has(key)) continue;
        seen.add(key);
        lines.push({ name: ingredient.name, amount: ingredient.amount, recipeTitle: day.recipe.title });
      }
    }
    return lines;
  }, [plan]);

  const generate = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    void runWeeklyPlan();
  }, []);

  const addMissing = useCallback(() => {
    const added = addToShopping(missing);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert(t('shopping.title'), t('detail.addedToShopping', { count: added }));
  }, [addToShopping, missing]);

  const openRecipe = useCallback((recipe: Recipe) => router.push(`/recipes/${recipe.id}`), [router]);

  const plannedDate = plan ? new Date(plan.createdAt).toLocaleDateString({ en: 'en-GB', fr: 'fr-FR', ar: 'ar-TN' }[currentLocale()], { month: 'short', day: 'numeric' }) : '';

  return (
    <Screen edges={[]}>
      <Stack.Screen
        options={{
          title: t('plan.title'),
          headerRight: () =>
            status === 'loading' ? null : (
              <Pressable accessibilityRole="button" accessibilityLabel={t('plan.regenerate')} onPress={generate} hitSlop={8}>
                <Ionicons name="refresh" size={22} color={colors.sage700} />
              </Pressable>
            ),
        }}
      />

      {status === 'loading' ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-sage-100">
            <ActivityIndicator size="large" color={colors.sage600} />
          </View>
          <Text className="text-xl font-bold text-ink-900">{t('plan.thinking')}</Text>
          <View className="mt-8">
            <Button
              title={t('common.cancel')}
              variant="ghost"
              onPress={() => {
                cancelWeeklyPlan();
                useRecipeStore.getState().clearPlan();
              }}
            />
          </View>
        </View>
      ) : status === 'error' ? (
        <View className="flex-1 justify-center">
          <EmptyState
            icon="alert-circle-outline"
            title={t('recipes.snagTitle')}
            message={error ?? t('errors.generic')}
            action={{ label: t('common.retry'), icon: 'refresh', onPress: generate }}
          />
        </View>
      ) : !plan ? (
        <View className="flex-1 justify-center">
          <EmptyState
            icon="calendar-outline"
            title={t('plan.emptyTitle')}
            message={pantryCount === 0 ? t('plan.emptyMessage') : t('plan.subtitle')}
            action={pantryCount === 0 ? undefined : { label: t('plan.generate'), icon: 'sparkles', onPress: generate }}
          />
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerClassName="px-5 pb-12 pt-4" showsVerticalScrollIndicator={false}>
          <Text className="text-2xl font-bold text-ink-900">{t('plan.title')}</Text>
          <Text className="mt-1 text-sm text-ink-600">{t('plan.planned', { date: plannedDate })}</Text>

          <View className="mt-4 gap-4">
            {plan.days.map((day) => (
              <View key={day.weekday}>
                <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-400">{dayName(day.weekday)}</Text>
                <RecipeCard recipe={day.recipe} saved={savedIds.has(day.recipe.id)} onToggleSave={toggleSaved} onPress={openRecipe} />
              </View>
            ))}
          </View>

          <View className="mt-6 gap-2.5">
            {missing.length > 0 ? (
              <Button title={t('plan.addAllMissing', { count: missing.length })} icon="cart-outline" size="lg" fullWidth onPress={addMissing} />
            ) : (
              <Text className="text-center text-sm text-ink-600">{t('plan.allCovered')}</Text>
            )}
            <Button title={t('plan.regenerate')} icon="refresh" variant="secondary" fullWidth onPress={generate} />
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}
