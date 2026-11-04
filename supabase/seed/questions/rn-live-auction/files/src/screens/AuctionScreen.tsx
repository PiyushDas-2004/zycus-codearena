import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { BidBoard } from '../components/BidBoard';
import { formatRemaining, useCountdown } from '../hooks/useCountdown';
import { useBidFeed, useOnForeground } from '../hooks/useAuctionListeners';
import type { AuctionSocket } from '../realtime/auctionSocket';
import type { Bid } from '../types';
import { formatRupees, isValidBid, parseRupees } from '../utils/money';

/** Minimum amount (rupees) a new bid must undercut the best bid by. */
export const MIN_DECREMENT = 0.1;

export function AuctionScreen({
  socket,
  initialBids,
  closesAt,
  onPlaceBid,
  onResync,
}: {
  socket: AuctionSocket;
  initialBids: Bid[];
  closesAt: number;
  onPlaceBid: (amountMinor: number) => void;
  onResync: () => void;
}) {
  const [bids, setBids] = useState(initialBids);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const { remaining, closed } = useCountdown(closesAt);

  useBidFeed(socket, (bid) => setBids((current) => [...current, bid].sort((a, b) => a.amountMinor - b.amountMinor)));
  useOnForeground(onResync);

  const best = bids.length ? bids[0]!.amountMinor / 100 : Infinity;
  const amount = parseRupees(input);
  const canBid = !closed && amount !== null && isValidBid(amount, best, MIN_DECREMENT);

  return (
    <View>
      <Text testID="countdown">{closed ? 'Auction closed' : formatRemaining(remaining)}</Text>
      <Text testID="best">{Number.isFinite(best) ? formatRupees(best) : '—'}</Text>
      <BidBoard bids={bids} selectedId={selectedId} onSelect={(id) => setSelectedId(id)} />
      <TextInput testID="amount" value={input} onChangeText={setInput} keyboardType="decimal-pad" />
      <Pressable
        testID="place-bid"
        disabled={!canBid}
        onPress={() => amount !== null && onPlaceBid(Math.round(amount * 100))}
      >
        <Text>Place bid</Text>
      </Pressable>
    </View>
  );
}
