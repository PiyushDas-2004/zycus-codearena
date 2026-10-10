import React, { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, type ListRenderItem } from 'react-native';
import { trackRender } from '../debug/renderCounter';
import type { Bid } from '../types';
import { formatRupees } from '../utils/money';

interface BidRowProps {
  bid: Bid;
  rank: number;
  selected: boolean;
  /** Stable across renders: the row calls it with its own id. */
  onSelect: (id: string) => void;
}

// FIX: React.memo compares props by identity. A new `onPress` closure and a new `style` object on
// every render made every row re-render on every parent render (every countdown tick, every bid).
// Rows now get only stable props: data, rank, a boolean, and a stable onSelect(id).
export const BidRow = React.memo(function BidRow({ bid, rank, selected, onSelect }: BidRowProps) {
  trackRender(`BidRow:${bid.id}`);
  return (
    <Pressable
      testID={`bid-${bid.id}`}
      onPress={() => onSelect(bid.id)}
      style={[styles.row, selected ? styles.selected : styles.unselected]}
    >
      <Text>#{rank}</Text>
      <Text style={styles.supplier}>{bid.supplier}</Text>
      <Text testID={`bid-${bid.id}-amount`}>{formatRupees(bid.amountMinor / 100)}</Text>
      {selected && <Text testID={`bid-${bid.id}-selected`}>Selected</Text>}
    </Pressable>
  );
});

export const BidBoard = React.memo(function BidBoard({
  bids,
  selectedId,
  onSelect,
}: {
  bids: Bid[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const renderItem = useCallback<ListRenderItem<Bid>>(
    ({ item, index }) => (
      <BidRow bid={item} rank={index + 1} selected={item.id === selectedId} onSelect={onSelect} />
    ),
    [selectedId, onSelect],
  );
  return <FlatList testID="bid-board" data={bids} keyExtractor={(b) => b.id} renderItem={renderItem} />;
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 16 },
  selected: { opacity: 1 },
  unselected: { opacity: 0.9 },
  supplier: { flex: 1, marginHorizontal: 8 },
});
