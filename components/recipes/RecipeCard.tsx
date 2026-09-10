import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { formatDuration } from '@/lib/utils';
import type { Difficulty, Recipe } from '@/types';

interface RecipeCardProps {
  recipe: Recipe;
  saved: boolean;
  onToggleSave: (recipe: Recipe) => void;
  onPress?: (recipe: Recipe) => void;
}

function difficultyLabel(difficulty: Difficulty): string {
  return t(`common.${difficulty}`);
}

function Chip({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View className="flex-row items-center rounded-full bg-cream-100 px-2.5 py-1">
      <Ionicons name={icon} size={13} color={colors.ink600} />
      <Text className="ml-1 text-xs font-medium text-ink-600">{label}</Text>
    </View>
  );
}

export function RecipeCard({ recipe, saved, onToggleSave, onPress }: RecipeCardProps) {
  const pantryCount = recipe.ingredients.filter((ingredient) => ingredient.inPantry).length;
  const totalMinutes = recipe.prepMinutes + recipe.cookMinutes;

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onToggleSave(recipe);
  };

  return (
    <Pressable
      accessible={false}
      onPress={onPress ? () => onPress(recipe) : undefined}
      disabled={!onPress}
      className="active:opacity-90"
    >
      <Card>
        <View className="flex-row items-start">
          <View className="mr-3 h-14 w-14 items-center justify-center rounded-2xl bg-sage-100">
            <Text className="text-3xl">{recipe.emoji}</Text>
          </View>
          <View className="flex-1">
            <Text
              className="text-lg font-bold leading-6 text-ink-900"
              numberOfLines={2}
              accessibilityRole={onPress ? 'button' : undefined}
            >
              {recipe.title}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-ink-600" numberOfLines={2}>
              {recipe.description}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={saved ? t('detail.removeSaved') : t('detail.saveRecipe')}
            accessibilityState={{ selected: saved }}
            onPress={handleToggle}
            hitSlop={8}
            className="ml-2 h-9 w-9 items-center justify-center rounded-full active:bg-cream-100"
          >
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={saved ? colors.sage600 : colors.ink400}
            />
          </Pressable>
        </View>

        <View className="mt-3 flex-row flex-wrap gap-2">
          <Chip icon="time-outline" label={formatDuration(totalMinutes)} />
          <Chip icon="people-outline" label={t('common.servings', { count: recipe.servings })} />
          <Chip icon="speedometer-outline" label={difficultyLabel(recipe.difficulty)} />
          <Chip
            icon="basket-outline"
            label={t('common.inPantry', { have: pantryCount, total: recipe.ingredients.length })}
          />
        </View>
      </Card>
    </Pressable>
  );
}
