import { t } from '@/lib/i18n';

/** Generates a short, collision-resistant id without native dependencies. */
export function createId(): string {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${time}-${random}`;
}

/** Joins class names, skipping falsy values. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** Trims, collapses whitespace and capitalises the first letter. */
export function normalizeName(raw: string): string {
  const collapsed = raw.trim().replace(/\s+/g, ' ');
  if (!collapsed) return '';
  return collapsed.charAt(0).toUpperCase() + collapsed.slice(1);
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** "just now", "5m ago", "3h ago", "2d ago", then a short date. */
export function formatRelativeDate(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '';
  const diffMs = now.getTime() - then.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return t('common.justNow');
  if (minutes < 60) return t('common.minutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('common.hoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t('common.daysAgo', { count: days });
  return then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** 45 -> "45 min", 80 -> "1h 20m", 120 -> "2h" */
export function formatDuration(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  if (minutes < 60) return `${minutes} ${t('common.min')}`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

/** Days until an ISO date; negative when already past. */
export function daysUntil(iso: string, now: Date = new Date()): number {
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return Number.POSITIVE_INFINITY;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((startOfTarget.getTime() - startOfToday.getTime()) / 86_400_000);
}
