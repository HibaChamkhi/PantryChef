import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { t } from '@/lib/i18n';
import type { InventoryItem } from '@/types';

/**
 * Expiry reminders: one local notification per item with a use-by date,
 * delivered the day before it expires (or the same morning if that is
 * already tomorrow). Identifiers are derived from item ids so the schedule
 * can be reconciled idempotently whenever the pantry changes.
 */

const ID_PREFIX = 'expiry:';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain && current.status === 'denied') return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function hasPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  return current.granted;
}

function reminderDate(expiresAt: string, hour: number): { when: Date; label: 'today' | 'tomorrow' } | null {
  const expiry = new Date(expiresAt);
  if (Number.isNaN(expiry.getTime())) return null;
  const now = new Date();

  const dayBefore = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate() - 1, hour, 0, 0);
  if (dayBefore.getTime() > now.getTime()) return { when: dayBefore, label: 'tomorrow' };

  const sameDay = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate(), hour, 0, 0);
  if (sameDay.getTime() > now.getTime()) return { when: sameDay, label: 'today' };

  return null;
}

/** Reconciles scheduled reminders with the pantry. Returns how many are scheduled. */
export async function syncExpiryReminders(items: InventoryItem[], enabled: boolean, hour: number): Promise<number> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ours = scheduled.filter((request) => request.identifier.startsWith(ID_PREFIX));

  if (!enabled || !(await hasPermission())) {
    await Promise.all(ours.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)));
    return 0;
  }

  const wanted = new Map<string, { item: InventoryItem; when: Date; label: 'today' | 'tomorrow' }>();
  for (const item of items) {
    if (!item.expiresAt) continue;
    const target = reminderDate(item.expiresAt, hour);
    if (!target) continue;
    wanted.set(`${ID_PREFIX}${item.id}:${item.expiresAt}:${hour}`, { item, ...target });
  }

  const existing = new Set(ours.map((request) => request.identifier));
  await Promise.all(
    ours
      .filter((request) => !wanted.has(request.identifier))
      .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
  );

  for (const [identifier, entry] of wanted) {
    if (existing.has(identifier)) continue;
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: t('settings.notificationTitle', { name: entry.item.name }),
        body: t('settings.notificationBody', { when: t(`settings.${entry.label}`) }),
        sound: Platform.OS === 'ios' ? 'default' : undefined,
        data: { itemId: entry.item.id },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: entry.when },
    });
  }

  return wanted.size;
}

export async function scheduledReminderCount(): Promise<number> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.filter((request) => request.identifier.startsWith(ID_PREFIX)).length;
}
