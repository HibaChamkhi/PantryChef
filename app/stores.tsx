import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { Stack, useRouter } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { colors } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { findNearbyStores, formatDistance, onlineStoresForRegion, storeSearchUrl, type Coordinates, type NearbyStore } from '@/services/stores';
import { useShoppingStore } from '@/store/useShoppingStore';

type Mode = 'nearby' | 'online';
type Phase = 'idle' | 'locating' | 'searching' | 'ready' | 'noLocation' | 'error';

function openDirections(store: NearbyStore) {
  const label = encodeURIComponent(store.name);
  const url =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?daddr=${store.latitude},${store.longitude}&q=${label}`
      : `geo:${store.latitude},${store.longitude}?q=${store.latitude},${store.longitude}(${label})`;
  Linking.openURL(url).catch(() => {});
}

function Nearby() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [stores, setStores] = useState<NearbyStore[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mapRef = useRef<MapView>(null);

  const search = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    setPhase('locating');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setPhase('noLocation');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (controller.signal.aborted) return;
      const here = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setOrigin(here);
      setPhase('searching');
      const found = await findNearbyStores(here, controller.signal);
      if (controller.signal.aborted) return;
      setStores(found);
      setSelected(found[0]?.id ?? null);
      setPhase('ready');
    } catch (caught) {
      if (controller.signal.aborted) return;
      setError(caught instanceof Error && caught.name === 'StoresError' ? t('stores.networkError') : t('stores.networkError'));
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    void search();
    return () => abortRef.current?.abort();
  }, [search]);

  const focusStore = useCallback((store: NearbyStore) => {
    setSelected(store.id);
    mapRef.current?.animateToRegion({ latitude: store.latitude, longitude: store.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 400);
  }, []);

  if (phase === 'locating' || phase === 'searching' || phase === 'idle') {
    return (
      <View className="items-center px-8 py-16">
        <ActivityIndicator size="large" color={colors.sage600} />
        <Text className="mt-4 text-base text-ink-600">{phase === 'searching' ? t('stores.searching') : t('stores.locating')}</Text>
      </View>
    );
  }

  if (phase === 'noLocation') {
    return <EmptyState icon="navigate-outline" title={t('stores.nearby')} message={t('stores.noLocation')} action={{ label: t('common.retry'), icon: 'refresh', onPress: search }} />;
  }

  if (phase === 'error') {
    return <EmptyState icon="alert-circle-outline" title={t('recipes.snagTitle')} message={error ?? t('stores.networkError')} action={{ label: t('common.retry'), icon: 'refresh', onPress: search }} />;
  }

  if (stores.length === 0 || !origin) {
    return <EmptyState icon="storefront-outline" title={t('stores.nearby')} message={t('stores.noStores')} action={{ label: t('stores.refresh'), icon: 'refresh', onPress: search }} />;
  }

  return (
    <View>
      <View className="mt-4 h-64 overflow-hidden rounded-xl2 bg-cream-200" accessibilityLabel={t('stores.mapLabel')}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={{ latitude: origin.latitude, longitude: origin.longitude, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
          showsUserLocation
        >
          {stores.map((store) => (
            <Marker
              key={store.id}
              coordinate={{ latitude: store.latitude, longitude: store.longitude }}
              title={store.name}
              description={formatDistance(store.distance)}
              pinColor={store.id === selected ? colors.clay500 : colors.sage600}
              onPress={() => setSelected(store.id)}
            />
          ))}
        </MapView>
      </View>

      <Text className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-ink-400">{t('stores.count', { count: stores.length })}</Text>
      <View className="gap-2.5">
        {stores.map((store) => (
          <Pressable
            key={store.id}
            accessible={false}
            onPress={() => focusStore(store)}
            className={`rounded-xl2 border bg-white px-4 py-3 ${store.id === selected ? 'border-sage-300' : 'border-cream-200'}`}
          >
            <View className="flex-row items-start">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-sage-100">
                <Ionicons name="storefront-outline" size={20} color={colors.sage600} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-ink-900" accessibilityRole="button" accessibilityLabel={`${store.name}, ${formatDistance(store.distance)}`}>
                  {store.name}
                </Text>
                <Text className="mt-0.5 text-xs text-ink-400">
                  {[formatDistance(store.distance), store.address, store.openingHours].filter(Boolean).join(' · ')}
                </Text>
              </View>
            </View>
            <View className="mt-3 flex-row flex-wrap gap-2">
              <Button title={t('stores.directions')} icon="navigate-outline" size="sm" onPress={() => openDirections(store)} />
              {store.phone ? <Button title={t('stores.call')} icon="call-outline" size="sm" variant="secondary" onPress={() => Linking.openURL(`tel:${store.phone}`).catch(() => {})} /> : null}
              {store.website ? <Button title={t('stores.website')} icon="globe-outline" size="sm" variant="secondary" onPress={() => Linking.openURL(store.website as string).catch(() => {})} /> : null}
            </View>
          </Pressable>
        ))}
      </View>
      <Text className="mt-4 text-center text-xs text-ink-400">{t('stores.poweredBy')}</Text>
    </View>
  );
}

function Online() {
  const items = useShoppingStore((state) => state.items);
  const pending = useMemo(() => items.filter((item) => !item.checked), [items]);
  const [copied, setCopied] = useState(false);
  const stores = useMemo(() => onlineStoresForRegion(), []);

  const listText = useMemo(() => pending.map((item) => (item.amount ? `${item.name} (${item.amount})` : item.name)).join('\n'), [pending]);
  const searchTerm = useMemo(() => pending.slice(0, 3).map((item) => item.name).join(' '), [pending]);

  const copy = useCallback(async () => {
    if (!listText) return;
    await Clipboard.setStringAsync(listText);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [listText]);

  const open = useCallback(
    async (index: number) => {
      const store = stores[index];
      if (listText) await Clipboard.setStringAsync(listText).catch(() => {});
      Linking.openURL(storeSearchUrl(store, searchTerm || 'groceries')).catch(() => {});
    },
    [stores, listText, searchTerm],
  );

  return (
    <View className="mt-4">
      <Card>
        <Text className="text-xs font-bold uppercase tracking-wide text-ink-400">{t('stores.listPreview')}</Text>
        {pending.length === 0 ? (
          <Text className="mt-2 text-sm text-ink-600">{t('stores.emptyList')}</Text>
        ) : (
          <Text className="mt-2 text-sm leading-6 text-ink-900">{listText}</Text>
        )}
        <View className="mt-4">
          <Button title={copied ? t('stores.copied') : t('stores.copyList')} icon={copied ? 'checkmark' : 'copy-outline'} variant="secondary" fullWidth disabled={pending.length === 0} onPress={copy} />
        </View>
      </Card>

      <Text className="mb-2 mt-6 text-xs font-bold uppercase tracking-wide text-ink-400">{t('stores.online')}</Text>
      <Text className="mb-3 text-sm text-ink-600">{t('stores.onlineHint')}</Text>
      <View className="gap-2.5">
        {stores.map((store, index) => (
          <Pressable
            key={store.id}
            accessibilityRole="button"
            accessibilityLabel={t('stores.openStore', { name: store.name })}
            onPress={() => open(index)}
            className="flex-row items-center rounded-xl2 bg-white px-4 py-3 active:bg-cream-100"
          >
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-cream-100">
              <Ionicons name="cart-outline" size={20} color={colors.ink600} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-ink-900">{store.name}</Text>
              {searchTerm && store.url.includes('%s') ? (
                <Text className="text-xs text-ink-400" numberOfLines={1}>{t('stores.searchOn', { item: pending[0]?.name ?? '', name: store.name })}</Text>
              ) : null}
            </View>
            <Ionicons name="open-outline" size={18} color={colors.ink400} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function StoresScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('nearby');
  const segments = useMemo(
    () => [
      { value: 'nearby' as const, label: t('stores.nearby'), icon: 'location-outline' as const },
      { value: 'online' as const, label: t('stores.online'), icon: 'globe-outline' as const },
    ],
    [],
  );

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: t('stores.title'), headerBackTitle: t('tabs.shopping') }} />
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-12 pt-4" showsVerticalScrollIndicator={false}>
        <SegmentedControl options={segments} value={mode} onChange={setMode} />
        {mode === 'nearby' ? <Nearby /> : <Online />}
        {mode === 'online' && router.canGoBack() ? null : null}
      </ScrollView>
    </Screen>
  );
}
