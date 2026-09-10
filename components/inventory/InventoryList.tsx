import type { ReactElement } from 'react';
import { FlatList, View } from 'react-native';

import { InventoryItemRow } from '@/components/inventory/InventoryItemRow';
import type { InventoryItem } from '@/types';

interface InventoryListProps {
  items: InventoryItem[];
  onSetQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  ListEmptyComponent: ReactElement;
  ListHeaderComponent?: ReactElement;
}

export function InventoryList({
  items,
  onSetQuantity,
  onRemove,
  ListEmptyComponent,
  ListHeaderComponent,
}: InventoryListProps) {
  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <InventoryItemRow item={item} onSetQuantity={onSetQuantity} onRemove={onRemove} />
      )}
      ItemSeparatorComponent={() => <View className="h-2.5" />}
      ListEmptyComponent={ListEmptyComponent}
      ListHeaderComponent={ListHeaderComponent}
      contentContainerClassName="px-5 pb-32 pt-1"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
    />
  );
}
