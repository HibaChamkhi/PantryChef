import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { hasApiKey } from '@/services/ai';
import { ensurePermission, scheduledReminderCount, syncExpiryReminders } from '@/services/notifications';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { ALLERGENS, DIETS, LANGUAGES } from '@/types';

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <View className="mt-6">
      <Text className="text-xs font-bold uppercase tracking-wide text-ink-400">{title}</Text>
      {hint ? <Text className="mb-3 mt-1 text-sm text-ink-600">{hint}</Text> : <View className="h-3" />}
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const diet = useSettingsStore((state) => state.diet);
  const allergens = useSettingsStore((state) => state.allergens);
  const customAvoid = useSettingsStore((state) => state.customAvoid);
  const language = useSettingsStore((state) => state.language);
  const remindersEnabled = useSettingsStore((state) => state.remindersEnabled);
  const reminderHour = useSettingsStore((state) => state.reminderHour);
  const setDiet = useSettingsStore((state) => state.setDiet);
  const toggleAllergen = useSettingsStore((state) => state.toggleAllergen);
  const addCustomAvoid = useSettingsStore((state) => state.addCustomAvoid);
  const removeCustomAvoid = useSettingsStore((state) => state.removeCustomAvoid);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const setRemindersEnabled = useSettingsStore((state) => state.setRemindersEnabled);
  const setReminderHour = useSettingsStore((state) => state.setReminderHour);
  const items = useInventoryStore((state) => state.items);

  const [custom, setCustom] = useState('');
  const [scheduled, setScheduled] = useState(0);

  const refreshScheduled = useCallback(() => {
    scheduledReminderCount().then(setScheduled).catch(() => setScheduled(0));
  }, []);

  useEffect(() => {
    refreshScheduled();
  }, [refreshScheduled, remindersEnabled, reminderHour, items]);

  const onToggleReminders = async (value: boolean) => {
    if (value) {
      const granted = await ensurePermission();
      if (!granted) {
        Alert.alert(t('settings.reminders'), t('settings.permissionDenied'));
        setRemindersEnabled(false);
        return;
      }
    }
    setRemindersEnabled(value);
    Haptics.selectionAsync().catch(() => {});
    await syncExpiryReminders(useInventoryStore.getState().items, value, reminderHour);
    refreshScheduled();
  };

  const addCustom = () => {
    if (!custom.trim()) return;
    addCustomAvoid(custom);
    setCustom('');
    Haptics.selectionAsync().catch(() => {});
  };

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen
        options={{
          title: t('settings.title'),
          headerLeft: () => (
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.done')} onPress={close} hitSlop={8}>
              <Text className="text-base font-semibold text-sage-700">{t('common.done')}</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-12 pt-2" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Section title={t('settings.diet')} hint={t('settings.dietHint')}>
          <View className="flex-row flex-wrap gap-2">
            {DIETS.map((option) => (
              <Chip key={option} label={t(`settings.diets.${option}`)} selected={diet === option} onPress={() => setDiet(option)} />
            ))}
          </View>
        </Section>

        <Section title={t('settings.allergies')} hint={t('settings.allergiesHint')}>
          <View className="flex-row flex-wrap gap-2">
            {ALLERGENS.map((option) => (
              <Chip
                key={option}
                label={t(`settings.allergens.${option}`)}
                selected={allergens.includes(option)}
                onPress={() => toggleAllergen(option)}
              />
            ))}
            {customAvoid.map((value) => (
              <Chip key={value} label={value} selected icon="close" onPress={() => removeCustomAvoid(value)} />
            ))}
          </View>
          <View className="mt-3 flex-row items-center rounded-full border border-cream-300 bg-white pl-4 pr-1.5">
            <TextInput
              value={custom}
              onChangeText={setCustom}
              onSubmitEditing={addCustom}
              placeholder={t('settings.customAvoidPlaceholder')}
              placeholderTextColor={colors.ink400}
              accessibilityLabel={t('settings.customAvoidLabel')}
              returnKeyType="done"
              className="h-12 flex-1 text-base text-ink-900"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('settings.addAvoid')}
              onPress={addCustom}
              disabled={!custom.trim()}
              className={`h-9 w-9 items-center justify-center rounded-full ${custom.trim() ? 'bg-sage-600' : 'bg-cream-200'}`}
            >
              <Ionicons name="add" size={18} color={custom.trim() ? '#ffffff' : colors.ink400} />
            </Pressable>
          </View>
        </Section>

        <Section title={t('settings.language')} hint={t('settings.languageHint')}>
          <View className="flex-row flex-wrap gap-2">
            {LANGUAGES.map((option) => (
              <Chip key={option} label={t(`settings.languages.${option}`)} selected={language === option} onPress={() => setLanguage(option)} />
            ))}
          </View>
        </Section>

        <Section title={t('settings.reminders')} hint={t('settings.remindersHint')}>
          <Card>
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold text-ink-900">
                {remindersEnabled ? t('settings.remindersOn') : t('settings.remindersOff')}
              </Text>
              <Switch
                value={remindersEnabled}
                onValueChange={onToggleReminders}
                trackColor={{ true: colors.sage500, false: colors.cream200 }}
                accessibilityLabel={t('settings.reminders')}
              />
            </View>
            <Text className="mt-1 text-sm text-ink-600">{t('settings.remindersScheduled', { count: scheduled })}</Text>
            <View className="mt-3 flex-row items-center justify-between">
              <Text className="text-sm text-ink-600">{t('settings.reminderTime')}</Text>
              <View className="flex-row items-center rounded-full bg-cream-100">
                <Pressable accessibilityRole="button" accessibilityLabel={t('misc.earlier')} onPress={() => setReminderHour(reminderHour - 1)} className="h-9 w-9 items-center justify-center rounded-full active:bg-cream-200">
                  <Ionicons name="remove" size={18} color={colors.sage700} />
                </Pressable>
                <Text className="min-w-[64px] text-center text-sm font-semibold text-ink-900">{`${reminderHour.toString().padStart(2, '0')}:00`}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={t('misc.later')} onPress={() => setReminderHour(reminderHour + 1)} className="h-9 w-9 items-center justify-center rounded-full active:bg-cream-200">
                  <Ionicons name="add" size={18} color={colors.sage700} />
                </Pressable>
              </View>
            </View>
          </Card>
        </Section>

        <Section title={t('settings.about')}>
          <Card>
            <Text className="text-sm text-ink-600">{t('settings.version', { version })}</Text>
            <Text className="mt-1 text-sm text-ink-600">{hasApiKey() ? t('settings.apiKeySet') : t('settings.apiKeyMissing')}</Text>
          </Card>
        </Section>

        <View className="mt-8">
          <Button title={t('common.done')} icon="checkmark" fullWidth onPress={close} />
        </View>
      </ScrollView>
    </Screen>
  );
}
