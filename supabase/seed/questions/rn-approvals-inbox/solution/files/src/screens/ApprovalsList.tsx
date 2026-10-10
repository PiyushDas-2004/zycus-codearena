import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Approval, Decision } from '../types';

export const ROW_HEIGHT = 72;
export const SEPARATOR_HEIGHT = 1;

/** Lets FlatList jump straight to a row (deep links call scrollToIndex). */
export function getItemLayout(_data: ArrayLike<Approval> | null | undefined, index: number) {
  // FIX: every row before `index` is followed by a separator.
  return { length: ROW_HEIGHT, offset: (ROW_HEIGHT + SEPARATOR_HEIGHT) * index, index };
}

const rupees = (minor: number) => `₹${(minor / 100).toFixed(2)}`;

function ApprovalRow({
  item,
  expanded,
  onToggle,
  onDecide,
}: {
  item: Approval;
  expanded: boolean;
  onToggle: () => void;
  onDecide: (id: string, decision: Decision, comment: string) => void;
}) {
  const [comment, setComment] = useState('');
  return (
    <View style={styles.row} testID={`row-${item.id}`}>
      <Pressable testID={`row-${item.id}-toggle`} onPress={onToggle}>
        <Text style={styles.title}>{item.title}</Text>
        <Text>{rupees(item.amountMinor)}</Text>
      </Pressable>
      {expanded && (
        <View testID={`row-${item.id}-details`}>
          <Text>Requested by {item.requestedBy}</Text>
          <TextInput
            testID={`row-${item.id}-comment`}
            value={comment}
            onChangeText={setComment}
            placeholder="Comment (required to reject)"
          />
          <Pressable testID={`row-${item.id}-approve`} onPress={() => onDecide(item.id, 'APPROVED', comment)}>
            <Text>Approve</Text>
          </Pressable>
          <Pressable
            testID={`row-${item.id}-reject`}
            disabled={comment.trim() === ''}
            onPress={() => onDecide(item.id, 'REJECTED', comment)}
          >
            <Text>Reject</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const Separator = () => <View style={styles.separator} />;

export function ApprovalsList({
  items,
  onDecide,
}: {
  items: Approval[];
  onDecide: (id: string, decision: Decision, comment: string) => void;
}) {
  // FIX: track the expanded row by id and key rows by id. Index-based state and keys move to a
  // different item when rows above are removed (and each row's local comment moves with them).
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <FlatList
      testID="approvals"
      data={items}
      keyExtractor={(item) => item.id}
      getItemLayout={getItemLayout}
      ItemSeparatorComponent={Separator}
      renderItem={({ item }) => (
        <ApprovalRow
          item={item}
          expanded={expanded === item.id}
          onToggle={() => setExpanded((cur) => (cur === item.id ? null : item.id))}
          onDecide={onDecide}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { minHeight: ROW_HEIGHT, paddingHorizontal: 16, justifyContent: 'center' },
  title: { fontWeight: '600' },
  separator: { height: SEPARATOR_HEIGHT, backgroundColor: '#E2E8F0' },
});
