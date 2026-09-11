import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Keyboard, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { categoryLabel } from '@/constants/categories';
import { colors } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { BarcodeError, isPlausibleBarcode, lookupBarcode, type BarcodeProduct } from '@/services/barcode';
import { useInventoryStore } from '@/store/useInventoryStore';
import { Text, TextInput } from '@/components/ui/Text';

type Phase = 'scanning' | 'looking' | 'found' | 'notFound' | 'error';

export default function BarcodeScreen() {
  const router = useRouter();
  const addItem = useInventoryStore((state) => state.addItem);
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>('scanning');
  const [code, setCode] = useState('');
  const [product, setProduct] = useState<BarcodeProduct | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lockRef = useRef(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission().catch(() => {});
    }
  }, [permission, requestPermission]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const lookup = useCallback(async (value: string) => {
    const clean = value.trim();
    if (!isPlausibleBarcode(clean)) {
      setError(t('barcode.notFound'));
      setPhase('error');
      return;
    }
    Keyboard.dismiss();
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setCode(clean);
    setPhase('looking');
    setError(null);
    try {
      const result = await lookupBarcode(clean, controller.signal);
      if (controller.signal.aborted) return;
      if (result) {
        setProduct(result);
        setPhase('found');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } else {
        setProduct(null);
        setPhase('notFound');
      }
    } catch (caught) {
      if (controller.signal.aborted) return;
      setError(caught instanceof BarcodeError && caught.code === 'network' ? t('barcode.networkError') : t('barcode.notFound'));
      setPhase('error');
    } finally {
      lockRef.current = false;
    }
  }, []);

  const onScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (lockRef.current || phase !== 'scanning') return;
      lockRef.current = true;
      Haptics.selectionAsync().catch(() => {});
      void lookup(result.data);
    },
    [lookup, phase],
  );

  const add = () => {
    if (!product) return;
    addItem({ name: product.name, category: product.category, quantity: 1, unit: 'pack' });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    close();
  };

  const reset = () => {
    abortRef.current?.abort();
    lockRef.current = false;
    setProduct(null);
    setError(null);
    setPhase('scanning');
  };

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const cameraReady = permission?.granted === true;

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen
        options={{
          title: t('barcode.title'),
          headerLeft: () => (
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.cancel')} onPress={close} hitSlop={8} className="min-w-[44px] items-center justify-center px-2">
              <Text className="text-center text-base text-sage-700">{t('common.cancel')}</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-10 pt-4" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text className="text-base text-ink-600">{t('barcode.hint')}</Text>

        <View className="mt-4 h-56 overflow-hidden rounded-xl2 bg-ink-900">
          {cameraReady && phase === 'scanning' ? (
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'] }}
              onBarcodeScanned={onScanned}
            />
          ) : (
            <View className="flex-1 items-center justify-center px-6">
              <Ionicons name="barcode-outline" size={40} color={colors.cream200} />
              <Text className="mt-2 text-center text-sm text-cream-200">
                {phase === 'scanning' ? t('barcode.cameraOff') : t('barcode.found')}
              </Text>
            </View>
          )}
          {phase === 'scanning' && cameraReady ? (
            <View pointerEvents="none" className="absolute inset-x-10 top-1/2 h-0.5 -translate-y-px bg-clay-400 opacity-80" />
          ) : null}
        </View>

        <Text className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-ink-400">{t('barcode.manualLabel')}</Text>
        <View className="flex-row items-center rounded-full border border-cream-300 bg-white pl-4 pr-1.5">
          <Ionicons name="keypad-outline" size={18} color={colors.ink400} />
          <TextInput
            value={code}
            onChangeText={setCode}
            onSubmitEditing={() => lookup(code)}
            placeholder={t('barcode.manualPlaceholder')}
            placeholderTextColor={colors.ink400}
            keyboardType="number-pad"
            returnKeyType="done"
            accessibilityLabel={t('barcode.manualLabel')}
            className="h-12 flex-1 px-3 text-base text-ink-900"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('barcode.lookup')}
            onPress={() => lookup(code)}
            disabled={!isPlausibleBarcode(code) || phase === 'looking'}
            className={`h-9 rounded-full px-3.5 ${isPlausibleBarcode(code) && phase !== 'looking' ? 'bg-sage-600' : 'bg-cream-200'} items-center justify-center`}
          >
            <Text className={`text-sm font-semibold ${isPlausibleBarcode(code) && phase !== 'looking' ? 'text-white' : 'text-ink-400'}`}>{t('barcode.lookup')}</Text>
          </Pressable>
        </View>

        {phase === 'looking' ? (
          <View className="mt-6 flex-row items-center justify-center">
            <ActivityIndicator color={colors.sage600} />
            <Text className="ml-3 text-base text-ink-600">{t('barcode.looking')}</Text>
          </View>
        ) : null}

        {phase === 'found' && product ? (
          <Card className="mt-5">
            <Text className="text-xs font-bold uppercase tracking-wide text-ink-400">{t('barcode.found')}</Text>
            <View className="mt-2 flex-row items-center">
              {product.imageUrl ? (
                <Image source={{ uri: product.imageUrl }} className="mr-3 h-16 w-16 rounded-xl bg-cream-100" resizeMode="contain" />
              ) : null}
              <View className="flex-1">
                <Text className="text-lg font-bold text-ink-900">{product.name}</Text>
                <Text className="mt-0.5 text-sm text-ink-600">
                  {[product.brand, product.quantity, categoryLabel(product.category)].filter(Boolean).join(' · ')}
                </Text>
              </View>
            </View>
            <View className="mt-4 gap-2.5">
              <Button title={t('barcode.addToPantry')} icon="checkmark" size="lg" fullWidth onPress={add} />
              <Button title={t('barcode.scanAgain')} icon="refresh" variant="secondary" fullWidth onPress={reset} />
            </View>
          </Card>
        ) : null}

        {phase === 'notFound' || phase === 'error' ? (
          <View className="mt-5 gap-2.5">
            <View className="flex-row items-start rounded-xl2 bg-danger-100 px-4 py-3">
              <Ionicons name="alert-circle-outline" size={18} color={colors.danger500} />
              <Text className="ml-2 flex-1 text-sm text-danger-500">{error ?? t('barcode.notFound')}</Text>
            </View>
            <Button title={t('barcode.scanAgain')} icon="refresh" variant="secondary" fullWidth onPress={reset} />
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
