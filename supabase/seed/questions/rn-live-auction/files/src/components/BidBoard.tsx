import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { trackRender } from '../debug/renderCounter';
import type { Bid } from '../types';
import { formatRupees } from '../utils/money';

interface BidRowProps {
  bid: Bid;
  rank: number;
  selected: boolean;
  onPress: () => void;
  style: ViewStyle;
}

/** One row of the leaderboard. Memoised: the board can hold 300+ bids in the final minutes. */
export const BidRow = React.memo(function BidRow({ bid, rank, selected, onPress, style }: BidRowProps) {
  trackRender(`BidRow:${bid.id}`);
  return (
    <Pressable testID={`bid-${bid.id}`} onPress={onPress} style={[styles.row, style]}>
      <Text>#{rank}</Text>
      <Text style={styles.supplier}>{bid.supplier}</Text>
      <Text testID={`bid-${bid.id}-amount`}>{formatRupees(bid.amountMinor / 100)}</Text>
      {selected && <Text testID={`bid-${bid.id}-selected`}>Selected</Text>}
    </Pressable>
  );
});

export function BidBoard({
  bids,
  selectedId,
  onSelect,
}: {
  bids: Bid[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <FlatList
      testID="bid-board"
      data={bids}
      keyExtractor={(b) => b.id}
      renderItem={({ item, index }) => (
        <BidRow
          bid={item}
          rank={index + 1}
          selected={item.id === selectedId}
          onPress={() => onSelect(item.id)}
          style={{ opacity: item.id === selectedId ? 1 : 0.9 }}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 16 },
  supplier: { flex: 1, marginHorizontal: 8 },
});
