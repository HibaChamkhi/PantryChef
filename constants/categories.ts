import { t } from '@/lib/i18n';
import type { Category } from '@/types';

export interface CategoryMeta {
  label: string;
  emoji: string;
  /** Background tint for the item avatar */
  tint: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  produce: { label: 'Produce', emoji: '🥬', tint: '#e5ecdf' },
  dairy: { label: 'Dairy & eggs', emoji: '🥛', tint: '#f8f5ee' },
  meat: { label: 'Meat & poultry', emoji: '🍗', tint: '#f9e3e0' },
  seafood: { label: 'Seafood', emoji: '🐟', tint: '#e0eef5' },
  grains: { label: 'Grains & pasta', emoji: '🍞', tint: '#f5ecd9' },
  pantry: { label: 'Pantry staples', emoji: '🥫', tint: '#f0eadb' },
  spices: { label: 'Herbs & spices', emoji: '🌿', tint: '#e5ecdf' },
  frozen: { label: 'Frozen', emoji: '🧊', tint: '#e6f1f5' },
  beverages: { label: 'Beverages', emoji: '🧃', tint: '#f5e9d9' },
  other: { label: 'Other', emoji: '🧺', tint: '#eeeeea' },
};

/** Localised category name. */
export function categoryLabel(category: Category): string {
  return t(`categories.${category}`);
}
