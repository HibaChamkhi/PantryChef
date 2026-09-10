import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

import { RecipeCard } from '@/components/recipes/RecipeCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { AiError, hasApiKey } from '@/services/ai';
import { identifyDish } from '@/services/dish';
import type { PhotoInput } from '@/services/vision';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useRecipeStore } from '@/store/useRecipeStore';
import { selectPreferences, useSettingsStore } from '@/store/useSettingsStore';
import type { Recipe } from '@/types';

export default function ScanScreen() {
  const router = useRouter();
  const pantry = useInventoryStore((state) => state.items);
  const scan = useRecipeStore((state) => state.scan);
  const status = useRecipeStore((state) => state.scanStatus);
  const error = useRecipeStore((state) => state.scanError);
  const saved = useRecipeStore((state) => state.saved);
  const toggleSaved = useRecipeStore((state) => state.toggleSaved);
  const abortRef = useRef<AbortController | null>(null);
  const lastPhotoRef = useRef<PhotoInput | null>(null);

  const savedIds = useMemo(() => new Set(saved.map((recipe) => recipe.id)), [saved]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const analyze = useCallback(
    async (photo: PhotoInput) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      lastPhotoRef.current = photo;

      const store = useRecipeStore.getState();
      store.startScan();
      try {
        const preferences = selectPreferences(useSettingsStore.getState());
        const result = await identifyDish(photo, pantry, { signal: controller.signal, preferences });
        if (controller.signal.aborted) return;
        useRecipeStore.getState().setScan(result);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } catch (caught) {
        if (controller.signal.aborted) return;
        useRecipeStore
          .getState()
          .failScan(caught instanceof AiError ? caught.message : t('errors.generic'));
      }
    },
    [pantry],
  );

  const pickerOptions: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    quality: 0.6,
    base64: hasApiKey(),
  };

  const chooseFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
      if (result.canceled || result.assets.length === 0) return;
      const asset = result.assets[0];
      await analyze({ uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType, assetId: asset.assetId });
    } catch {
      Alert.alert(t('addItem.photoAccess'), t('addItem.photoAccessHint'));
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('addItem.cameraAccess'), t('addItem.cameraAccessHint'));
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync(pickerOptions);
      if (result.canceled || result.assets.length === 0) return;
      const asset = result.assets[0];
      await analyze({ uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType });
    } catch {
      Alert.alert(t('addItem.cameraUnavailable'), t('addItem.cameraUnavailableHint'));
    }
  };

  const reset = () => {
    abortRef.current?.abort();
    useRecipeStore.getState().resetScan();
  };

  const openRecipe = useCallback((recipe: Recipe) => router.push(`/recipes/${recipe.id}`), [router]);

  const photoUri = status === 'loading' ? lastPhotoRef.current?.uri : scan?.photoUri;

  return (
    <Screen>
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-32 pt-2" showsVerticalScrollIndicator={false}>
        <Text className="text-3xl font-bold text-ink-900">{t('scan.title')}</Text>
        <Text className="mt-1 text-base text-ink-600">{t('scan.subtitle')}</Text>

        {photoUri ? (
          <View className="mt-5 overflow-hidden rounded-xl2 bg-cream-200">
            <Image source={{ uri: photoUri }} className="h-60 w-full" resizeMode="cover" accessibilityLabel={t('scan.title')} />
            {status === 'loading' ? (
              <View className="absolute inset-0 items-center justify-center bg-ink-900/40">
                <ActivityIndicator size="large" color="#ffffff" />
                <Text className="mt-3 text-base font-semibold text-white">{t('scan.identifying')}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View className="mt-5 items-center rounded-xl2 border border-dashed border-cream-300 bg-white px-6 py-10">
            <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-sage-100">
              <Ionicons name="restaurant-outline" size={30} color={colors.sage600} />
            </View>
            <Text className="text-center text-lg font-semibold text-ink-900">{t('scan.emptyTitle')}</Text>
            <Text className="mt-1 text-center text-sm leading-5 text-ink-600">{t('scan.emptyHint')}</Text>
          </View>
        )}

        {status === 'idle' || status === 'error' ? (
          <View className="mt-4 gap-2.5">
            {status === 'error' && error ? (
              <View className="flex-row items-start rounded-xl2 bg-danger-100 px-4 py-3">
                <Ionicons name="alert-circle-outline" size={18} color={colors.danger500} />
                <Text className="ml-2 flex-1 text-sm text-danger-500">{error}</Text>
              </View>
            ) : null}
            <Button title={t('scan.takePhoto')} icon="camera-outline" size="lg" fullWidth onPress={takePhoto} />
            <Button title={t('scan.choosePhoto')} icon="images-outline" variant="secondary" size="lg" fullWidth onPress={chooseFromLibrary} />
            {status === 'error' && lastPhotoRef.current ? (
              <Button title={t('addItem.retryAnalysis')} icon="refresh" variant="ghost" onPress={() => analyze(lastPhotoRef.current as PhotoInput)} />
            ) : null}
          </View>
        ) : null}

        {status === 'loading' ? (
          <View className="mt-4">
            <Button title={t('common.cancel')} variant="ghost" onPress={reset} />
          </View>
        ) : null}

        {status === 'success' && scan ? (
          <View>
            <Card className="mt-4">
              <Text className="text-xs font-bold uppercase tracking-wide text-ink-400">{t('scan.looksLike')}</Text>
              <Text className="mt-1 text-2xl font-bold text-ink-900">{scan.dish.name}</Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                {scan.dish.cuisine ? (
                  <View className="flex-row items-center rounded-full bg-sage-100 px-2.5 py-1">
                    <Ionicons name="earth-outline" size={13} color={colors.sage700} />
                    <Text className="ml-1 text-xs font-semibold text-sage-700">{scan.dish.cuisine}</Text>
                  </View>
                ) : null}
                <View className="flex-row items-center rounded-full bg-cream-100 px-2.5 py-1">
                  <Ionicons name="analytics-outline" size={13} color={colors.ink600} />
                  <Text className="ml-1 text-xs font-medium text-ink-600">
                    {t('addItem.sure', { percent: Math.round(scan.dish.confidence * 100) })}
                  </Text>
                </View>
              </View>
              <Text className="mt-3 text-base leading-6 text-ink-600">{scan.dish.description}</Text>
              {scan.dish.keyIngredients.length > 0 ? (
                <View className="mt-3 flex-row flex-wrap gap-1.5">
                  {scan.dish.keyIngredients.map((ingredient) => (
                    <Text key={ingredient} className="rounded-full bg-cream-100 px-2.5 py-1 text-xs text-ink-600">
                      {ingredient}
                    </Text>
                  ))}
                </View>
              ) : null}
            </Card>

            <Text className="mb-2 mt-6 text-xs font-bold uppercase tracking-wide text-ink-400">{t('scan.recipesFor')}</Text>
            {scan.recipes.length === 0 ? (
              <Text className="text-sm text-ink-600">{t('scan.noRecipe')}</Text>
            ) : (
              <View className="gap-3">
                {scan.recipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    saved={savedIds.has(recipe.id)}
                    onToggleSave={toggleSaved}
                    onPress={openRecipe}
                  />
                ))}
              </View>
            )}

            {scan.simulated ? (
              <Text className="mt-3 text-xs leading-4 text-ink-400">{t('scan.simulatedNote')}</Text>
            ) : null}

            <View className="mt-6">
              <Button title={t('scan.scanAnother')} icon="camera-outline" variant="secondary" fullWidth onPress={reset} />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
