import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';

import { QuantityStepper } from '@/components/inventory/QuantityStepper';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { CATEGORY_META, categoryLabel } from '@/constants/categories';
import { colors } from '@/constants/theme';
import { categorize } from '@/lib/categorize';
import { t, unitLabel } from '@/lib/i18n';
import { cn, normalizeName } from '@/lib/utils';
import { AiError, hasApiKey } from '@/services/ai';
import { recognizeReceipt } from '@/services/receipt';
import { recognizeIngredients, type DetectedIngredient, type PhotoInput } from '@/services/vision';
import { useInventoryStore } from '@/store/useInventoryStore';
import { CATEGORIES, UNITS, type Category, type Unit } from '@/types';
import { Text, TextInput } from '@/components/ui/Text';
import type { TextInput as RNTextInputType } from 'react-native';

type Mode = 'manual' | 'photo' | 'receipt';

const EXPIRY_DAYS: Array<number | null> = [null, 2, 5, 7, 14, 30];

function expiryLabel(days: number | null): string {
  if (days === null) return t('addItem.noDate');
  if (days === 7) return t('addItem.week');
  if (days === 14) return t('addItem.twoWeeks');
  if (days === 30) return t('addItem.month');
  return t('addItem.days', { count: days });
}

function expiryDate(days: number | null): string | undefined {
  if (days === null) return undefined;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function SectionLabel({ children }: { children: string }) {
  return <Text className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-ink-400">{children}</Text>;
}

/* ---------------------------------- Manual --------------------------------- */

function ManualForm({ onSaved, onScanBarcode }: { onSaved: () => void; onScanBarcode: () => void }) {
  const addItem = useInventoryStore((state) => state.addItem);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<Unit>('pcs');
  const [category, setCategory] = useState<Category>('other');
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [expiryDays, setExpiryDays] = useState<number | null>(null);
  const inputRef = useRef<RNTextInputType>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!categoryTouched) setCategory(categorize(name));
  }, [name, categoryTouched]);

  const canSave = normalizeName(name).length > 0;

  const save = () => {
    if (!canSave) return;
    addItem({ name, quantity, unit, category, expiresAt: expiryDate(expiryDays) });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onSaved();
  };

  return (
    <View>
      <SectionLabel>{t('addItem.ingredient')}</SectionLabel>
      <TextInput
        ref={inputRef}
        value={name}
        onChangeText={setName}
        placeholder={t('addItem.namePlaceholder')}
        placeholderTextColor={colors.ink400}
        returnKeyType="done"
        onSubmitEditing={save}
        autoCapitalize="sentences"
        accessibilityLabel={t('addItem.nameLabel')}
        className="h-13 rounded-xl2 border border-cream-300 bg-white px-4 py-3.5 text-base text-ink-900"
      />
      <Pressable accessibilityRole="button" accessibilityLabel={t('addItem.scanBarcode')} onPress={onScanBarcode} className="mt-2 flex-row items-center self-start rounded-full px-1 py-1 active:opacity-70">
        <Ionicons name="barcode-outline" size={16} color={colors.sage700} />
        <Text className="ml-1.5 text-sm font-semibold text-sage-700">{t('addItem.scanBarcode')}</Text>
      </Pressable>

      <SectionLabel>{t('addItem.quantity')}</SectionLabel>
      <View className="flex-row items-center justify-between rounded-xl2 border border-cream-300 bg-white px-4 py-3">
        <Text className="text-base text-ink-600">{t('addItem.howMuch')}</Text>
        <QuantityStepper value={quantity} unit={unit} onChange={setQuantity} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2.5" contentContainerClassName="gap-2 pr-4">
        {UNITS.map((option) => (
          <Chip key={option} label={unitLabel(option)} selected={unit === option} onPress={() => setUnit(option)} />
        ))}
      </ScrollView>

      <SectionLabel>{t('addItem.category')}</SectionLabel>
      <View className="flex-row flex-wrap gap-2">
        {CATEGORIES.map((option) => (
          <Chip
            key={option}
            label={`${CATEGORY_META[option].emoji} ${categoryLabel(option)}`}
            selected={category === option}
            onPress={() => {
              setCategoryTouched(true);
              setCategory(option);
            }}
          />
        ))}
      </View>
      {!categoryTouched && canSave ? <Text className="mt-2 text-xs text-ink-400">{t('addItem.guessed')}</Text> : null}

      <SectionLabel>{t('addItem.useBy')}</SectionLabel>
      <View className="flex-row flex-wrap gap-2">
        {EXPIRY_DAYS.map((days) => (
          <Chip key={String(days)} label={expiryLabel(days)} selected={expiryDays === days} onPress={() => setExpiryDays(days)} />
        ))}
      </View>

      <View className="mt-8">
        <Button title={t('addItem.addToPantry')} icon="checkmark" size="lg" fullWidth disabled={!canSave} onPress={save} />
      </View>
    </View>
  );
}

/* ----------------------------- Photo & receipt ------------------------------ */

type PhotoPhase = 'idle' | 'analyzing' | 'results' | 'error';

function PhotoCapture({ onSaved, kind }: { onSaved: () => void; kind: 'ingredients' | 'receipt' }) {
  const addMany = useInventoryStore((state) => state.addMany);
  const [photo, setPhoto] = useState<PhotoInput | null>(null);
  const [phase, setPhase] = useState<PhotoPhase>('idle');
  const [detected, setDetected] = useState<DetectedIngredient[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [simulated, setSimulated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const analyze = useCallback(
    async (picked: PhotoInput) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setPhoto(picked);
      setPhase('analyzing');
      setError(null);
      try {
        const result =
          kind === 'receipt'
            ? await recognizeReceipt(picked, { signal: controller.signal })
            : await recognizeIngredients(picked, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setDetected(result.items);
        setSelected(new Set(result.items.map((_, index) => index)));
        setSimulated(result.simulated);
        setPhase('results');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } catch (caught) {
        if (controller.signal.aborted) return;
        setError(caught instanceof AiError ? caught.message : t('errors.generic'));
        setPhase('error');
      }
    },
    [kind],
  );

  const pickerOptions: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6, base64: hasApiKey() };

  const chooseFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
      if (result.canceled || result.assets.length === 0) return;
      const asset = result.assets[0];
      await analyze({ uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType });
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

  const toggle = (index: number) => {
    Haptics.selectionAsync().catch(() => {});
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const reset = () => {
    abortRef.current?.abort();
    setPhoto(null);
    setDetected([]);
    setSelected(new Set());
    setPhase('idle');
    setError(null);
  };

  const addSelected = () => {
    const chosen = detected.filter((_, index) => selected.has(index));
    if (chosen.length === 0) return;
    addMany(chosen.map(({ name, quantity, unit, category }) => ({ name, quantity, unit, category })));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onSaved();
  };

  const selectedCount = selected.size;
  const isReceipt = kind === 'receipt';

  return (
    <View>
      <SectionLabel>{isReceipt ? t('addItem.receipt') : t('addItem.photo')}</SectionLabel>
      {photo ? (
        <View className="overflow-hidden rounded-xl2 bg-cream-200">
          <Image source={{ uri: photo.uri }} className="h-56 w-full" resizeMode="cover" accessibilityLabel={t('addItem.photo')} />
          {phase === 'analyzing' ? (
            <View className="absolute inset-0 items-center justify-center bg-ink-900/40">
              <ActivityIndicator size="large" color="#ffffff" />
              <Text className="mt-3 text-base font-semibold text-white">{isReceipt ? t('addItem.readingReceipt') : t('addItem.analyzing')}</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View className="items-center rounded-xl2 border border-dashed border-cream-300 bg-white px-6 py-8">
          <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-sage-100">
            <Ionicons name={isReceipt ? 'receipt-outline' : 'camera-outline'} size={28} color={colors.sage600} />
          </View>
          <Text className="text-center text-base font-semibold text-ink-900">{isReceipt ? t('addItem.receiptTitle') : t('addItem.photoTitle')}</Text>
          <Text className="mt-1 text-center text-sm leading-5 text-ink-600">{isReceipt ? t('addItem.receiptHint') : t('addItem.photoHint')}</Text>
        </View>
      )}

      {phase === 'idle' || phase === 'error' ? (
        <View className="mt-4 gap-2.5">
          {phase === 'error' && error ? (
            <View className="flex-row items-start rounded-xl2 bg-danger-100 px-4 py-3">
              <Ionicons name="alert-circle-outline" size={18} color={colors.danger500} />
              <Text className="ml-2 flex-1 text-sm text-danger-500">{error}</Text>
            </View>
          ) : null}
          <Button title={t('addItem.takePhoto')} icon="camera-outline" size="lg" fullWidth onPress={takePhoto} />
          <Button title={t('addItem.chooseLibrary')} icon="images-outline" variant="secondary" size="lg" fullWidth onPress={chooseFromLibrary} />
          {phase === 'error' && photo ? <Button title={t('addItem.retryAnalysis')} icon="refresh" variant="ghost" onPress={() => analyze(photo)} /> : null}
        </View>
      ) : null}

      {phase === 'analyzing' ? (
        <View className="mt-4">
          <Button title={t('common.cancel')} variant="ghost" onPress={reset} />
        </View>
      ) : null}

      {phase === 'results' ? (
        <View>
          <SectionLabel>{detected.length === 0 ? t('addItem.nothingFound') : t('addItem.found', { count: t('common.ingredients', { count: detected.length }) })}</SectionLabel>
          {detected.length === 0 ? (
            <Text className="text-sm text-ink-600">{t('addItem.nothingFoundHint')}</Text>
          ) : (
            <View className="gap-2">
              {detected.map((item, index) => {
                const checked = selected.has(index);
                const meta = CATEGORY_META[item.category];
                return (
                  <Pressable
                    key={`${item.name}-${index}`}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    onPress={() => toggle(index)}
                    className={cn('flex-row items-center rounded-xl2 border bg-white px-4 py-3', checked ? 'border-sage-300' : 'border-cream-200')}
                  >
                    <Ionicons name={checked ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={checked ? colors.sage600 : colors.ink400} />
                    <Text className="ml-3 text-lg">{meta.emoji}</Text>
                    <View className="ml-2 flex-1">
                      <Text className="text-base font-semibold text-ink-900">{item.name}</Text>
                      <Text className="text-xs text-ink-400">
                        {item.quantity} {unitLabel(item.unit)} · {t('addItem.sure', { percent: Math.round(item.confidence * 100) })}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {simulated ? <Text className="mt-3 text-xs leading-4 text-ink-400">{t('addItem.simulatedNote')}</Text> : null}

          <View className="mt-6 gap-2.5">
            {detected.length > 0 ? (
              <Button
                title={selectedCount === 0 ? t('addItem.selectItems') : t('addItem.addSelected', { count: t('common.items', { count: selectedCount }) })}
                icon="checkmark"
                size="lg"
                fullWidth
                disabled={selectedCount === 0}
                onPress={addSelected}
              />
            ) : null}
            <Button title={t('addItem.differentPhoto')} icon="refresh" variant="secondary" fullWidth onPress={reset} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

/* ---------------------------------- Screen --------------------------------- */

export default function AddItemScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('manual');

  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);

  const segments = useMemo(
    () => [
      { value: 'manual' as const, label: t('addItem.typeIt'), icon: 'create-outline' as const },
      { value: 'photo' as const, label: t('addItem.snapPhoto'), icon: 'camera-outline' as const },
      { value: 'receipt' as const, label: t('addItem.receipt'), icon: 'receipt-outline' as const },
    ],
    [],
  );

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen
        options={{
          title: t('addItem.title'),
          headerLeft: () => (
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.cancel')} onPress={close} hitSlop={8} className="min-w-[44px] items-center justify-center px-2">
              <Text className="text-center text-base text-sage-700">{t('common.cancel')}</Text>
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView className="flex-1" contentContainerClassName="px-5 pb-10 pt-4" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <SegmentedControl options={segments} value={mode} onChange={setMode} />
          {mode === 'manual' ? (
            <ManualForm onSaved={close} onScanBarcode={() => router.push('/barcode')} />
          ) : (
            <PhotoCapture key={mode} onSaved={close} kind={mode === 'receipt' ? 'receipt' : 'ingredients'} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
