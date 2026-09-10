import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { StepCard } from '@/components/recipes/StepCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/constants/theme';
import { t, unitLabel } from '@/lib/i18n';
import { scaleAmount } from '@/lib/scale';
import { formatDuration } from '@/lib/utils';
import { matchPantryItems } from '@/services/dish';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useRecipeStore } from '@/store/useRecipeStore';
import { useShoppingStore } from '@/store/useShoppingStore';
import type { Difficulty } from '@/types';

function Meta({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View className="flex-row items-center rounded-full bg-cream-100 px-3 py-1.5">
      <Ionicons name={icon} size={14} color={colors.ink600} />
      <Text className="ml-1.5 text-xs font-semibold text-ink-600">{label}</Text>
    </View>
  );
}

function difficultyLabel(difficulty: Difficulty): string {
  return t(`common.${difficulty}`);
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const recipe = useRecipeStore((state) => state.getRecipe(id ?? ''));
  const isSaved = useRecipeStore((state) => state.saved.some((saved) => saved.id === id));
  const toggleSaved = useRecipeStore((state) => state.toggleSaved);
  const pantry = useInventoryStore((state) => state.items);
  const consume = useInventoryStore((state) => state.consume);
  const addToShopping = useShoppingStore((state) => state.addMany);

  const [doneSteps, setDoneSteps] = useState<Set<number>>(() => new Set());
  const [servings, setServings] = useState<number | null>(null);
  const [cookSheet, setCookSheet] = useState<'closed' | 'open' | 'done'>('closed');
  const [usedIds, setUsedIds] = useState<Set<string>>(() => new Set());

  useKeepAwake();

  const effectiveServings = servings ?? recipe?.servings ?? 1;
  const factor = recipe ? effectiveServings / recipe.servings : 1;

  const matched = useMemo(() => (recipe ? matchPantryItems(recipe, pantry) : []), [recipe, pantry]);
  const missing = useMemo(() => recipe?.ingredients.filter((ingredient) => !ingredient.inPantry) ?? [], [recipe]);

  const toggleStep = useCallback((order: number) => {
    Haptics.selectionAsync().catch(() => {});
    setDoneSteps((current) => {
      const next = new Set(current);
      if (next.has(order)) next.delete(order);
      else next.add(order);
      return next;
    });
  }, []);

  const markDoneFromTimer = useCallback((order: number) => {
    setDoneSteps((current) => (current.has(order) ? current : new Set(current).add(order)));
  }, []);

  const onToggleSave = useCallback(() => {
    if (!recipe) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    toggleSaved(recipe);
  }, [recipe, toggleSaved]);

  const share = useCallback(async () => {
    if (!recipe) return;
    const lines = [
      `${recipe.emoji} ${recipe.title}`,
      recipe.description,
      '',
      `${t('detail.shareIngredients')}:`,
      ...recipe.ingredients.map((ingredient) => `• ${ingredient.name} — ${scaleAmount(ingredient.amount, factor)}`),
      '',
      `${t('detail.shareSteps')}:`,
      ...recipe.steps.map((step) => `${step.order}. ${step.instruction}`),
      '',
      t('detail.shareFooter'),
    ];
    try {
      await Share.share({ title: recipe.title, message: lines.join('\n') });
    } catch {
      // The user dismissed the sheet or sharing is unavailable; nothing to do.
    }
  }, [recipe, factor]);

  const addMissing = useCallback(() => {
    if (!recipe) return;
    const added = addToShopping(missing.map((ingredient) => ({ name: ingredient.name, amount: scaleAmount(ingredient.amount, factor), recipeTitle: recipe.title })));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert(t('shopping.title'), t('detail.addedToShopping', { count: added }));
  }, [recipe, missing, factor, addToShopping]);

  const openCookSheet = useCallback(() => {
    setUsedIds(new Set(matched.map((item) => item.id)));
    setCookSheet('open');
  }, [matched]);

  const toggleUsed = useCallback((itemId: string) => {
    Haptics.selectionAsync().catch(() => {});
    setUsedIds((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }, []);

  const confirmDeduct = useCallback(() => {
    consume([...usedIds]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setCookSheet('done');
  }, [consume, usedIds]);

  if (!recipe) {
    return (
      <Screen edges={['bottom']}>
        <Stack.Screen options={{ title: t('recipes.title') }} />
        <View className="flex-1 justify-center">
          <EmptyState icon="search-outline" title={t('detail.notFoundTitle')} message={t('detail.notFoundMessage')} action={{ label: t('detail.backToPantry'), icon: 'basket-outline', onPress: () => router.replace('/') }} />
        </View>
      </Screen>
    );
  }

  const totalMinutes = recipe.prepMinutes + recipe.cookMinutes;
  const allDone = recipe.steps.length > 0 && doneSteps.size === recipe.steps.length;
  const pantryCount = recipe.ingredients.filter((ingredient) => ingredient.inPantry).length;

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <View className="flex-row items-center gap-4">
              <Pressable accessibilityRole="button" accessibilityLabel={t('detail.share')} onPress={share} hitSlop={8}>
                <Ionicons name="share-outline" size={24} color={colors.sage700} />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={isSaved ? t('detail.removeSaved') : t('detail.saveRecipe')} accessibilityState={{ selected: isSaved }} onPress={onToggleSave} hitSlop={8}>
                <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={24} color={colors.sage700} />
              </Pressable>
            </View>
          ),
        }}
      />

      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-12 pt-2" showsVerticalScrollIndicator={false}>
        <View className="items-center">
          <View className="h-24 w-24 items-center justify-center rounded-3xl bg-sage-100">
            <Text className="text-5xl">{recipe.emoji}</Text>
          </View>
          <Text className="mt-4 text-center text-2xl font-bold leading-8 text-ink-900">{recipe.title}</Text>
          <Text className="mt-2 text-center text-base leading-6 text-ink-600">{recipe.description}</Text>
          <View className="mt-4 flex-row flex-wrap justify-center gap-2">
            <Meta icon="time-outline" label={formatDuration(totalMinutes)} />
            <Meta icon="speedometer-outline" label={difficultyLabel(recipe.difficulty)} />
          </View>
        </View>

        <View className="mt-6 flex-row items-center justify-between rounded-xl2 bg-white px-4 py-3">
          <Text className="text-base font-semibold text-ink-900">{t('detail.servings')}</Text>
          <View className="flex-row items-center rounded-full bg-cream-100">
            <Pressable accessibilityRole="button" accessibilityLabel={t('detail.decreaseServings')} disabled={effectiveServings <= 1} onPress={() => setServings(effectiveServings - 1)} className="h-9 w-9 items-center justify-center rounded-full active:bg-cream-200">
              <Ionicons name="remove" size={18} color={effectiveServings <= 1 ? colors.ink400 : colors.sage700} />
            </Pressable>
            <Text className="min-w-[44px] text-center text-sm font-semibold text-ink-900">{effectiveServings}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t('detail.increaseServings')} disabled={effectiveServings >= 12} onPress={() => setServings(effectiveServings + 1)} className="h-9 w-9 items-center justify-center rounded-full active:bg-cream-200">
              <Ionicons name="add" size={18} color={effectiveServings >= 12 ? colors.ink400 : colors.sage700} />
            </Pressable>
          </View>
        </View>

        <Text className="mb-2 mt-6 text-xs font-bold uppercase tracking-wide text-ink-400">
          {t('detail.ingredients', { have: pantryCount, total: recipe.ingredients.length })}
        </Text>
        <Card className="p-0">
          {recipe.ingredients.map((ingredient, index) => (
            <View key={`${ingredient.name}-${index}`} className={`flex-row items-center px-4 py-3 ${index > 0 ? 'border-t border-cream-100' : ''}`}>
              <Ionicons name={ingredient.inPantry ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={ingredient.inPantry ? colors.sage600 : colors.ink400} />
              <Text className="ml-3 flex-1 text-base text-ink-900">{ingredient.name}</Text>
              <Text className="text-sm text-ink-400">{scaleAmount(ingredient.amount, factor)}</Text>
            </View>
          ))}
        </Card>
        <View className="mt-3">
          {missing.length > 0 ? (
            <Button title={t('detail.addMissing', { count: missing.length })} icon="cart-outline" variant="secondary" fullWidth onPress={addMissing} />
          ) : (
            <Text className="text-center text-sm text-sage-700">{t('detail.allInPantry')}</Text>
          )}
        </View>

        <View className="mb-2 mt-8 flex-row items-end justify-between">
          <Text className="text-xs font-bold uppercase tracking-wide text-ink-400">{t('detail.steps')}</Text>
          <Text className="text-xs text-ink-400">{t('detail.stepsDone', { done: doneSteps.size, steps: t('common.steps', { count: recipe.steps.length }) })}</Text>
        </View>
        <View className="gap-2.5">
          {recipe.steps.map((step) => (
            <StepCard key={step.order} step={step} done={doneSteps.has(step.order)} onToggleDone={toggleStep} onTimerComplete={markDoneFromTimer} />
          ))}
        </View>

        {cookSheet === 'closed' ? (
          <View className="mt-6">
            <Button title={t('detail.cookedIt')} icon="restaurant-outline" variant={allDone ? 'primary' : 'secondary'} size="lg" fullWidth onPress={openCookSheet} />
          </View>
        ) : null}

        {cookSheet === 'open' ? (
          <Card className="mt-6">
            <Text className="text-lg font-bold text-ink-900">{t('detail.cookedTitle')}</Text>
            <Text className="mt-1 text-sm leading-5 text-ink-600">{matched.length === 0 ? t('detail.nothingMatched') : t('detail.cookedMessage')}</Text>
            <View className="mt-3 gap-2">
              {matched.map((item) => {
                const checked = usedIds.has(item.id);
                return (
                  <Pressable key={item.id} accessibilityRole="checkbox" accessibilityState={{ checked }} accessibilityLabel={item.name} onPress={() => toggleUsed(item.id)} className="flex-row items-center rounded-xl2 bg-cream-100 px-3 py-2.5">
                    <Ionicons name={checked ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={checked ? colors.sage600 : colors.ink400} />
                    <Text className="ml-2.5 flex-1 text-base text-ink-900">{item.name}</Text>
                    <Text className="text-xs text-ink-400">{item.quantity} {unitLabel(item.unit)}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View className="mt-4 gap-2.5">
              {matched.length > 0 ? (
                <Button title={t('detail.confirmDeduct', { count: usedIds.size })} icon="checkmark" fullWidth disabled={usedIds.size === 0} onPress={confirmDeduct} />
              ) : null}
              <Button title={t('detail.keepAll')} variant="ghost" fullWidth onPress={() => setCookSheet('closed')} />
            </View>
          </Card>
        ) : null}

        {cookSheet === 'done' || allDone ? (
          <View className="mt-8 items-center rounded-xl2 bg-sage-100 px-5 py-6">
            <Text className="text-3xl">🎉</Text>
            <Text className="mt-2 text-lg font-bold text-sage-700">{t('detail.dinnerServed')}</Text>
            <Text className="mt-1 text-center text-sm text-ink-600">{isSaved ? t('detail.savedNote') : t('detail.saveHint')}</Text>
            {!isSaved ? (
              <View className="mt-4">
                <Button title={t('detail.saveRecipe')} icon="bookmark-outline" variant="secondary" onPress={onToggleSave} />
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
