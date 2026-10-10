import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import type { AuctionSocket } from '../realtime/auctionSocket';
import type { Bid } from '../types';

/** Live bids for the auction, only while this screen is focused (saves battery and data). */
export function useBidFeed(socket: AuctionSocket, onBid: (bid: Bid) => void) {
  // FIX: keep the latest callback in a ref and subscribe with ONE stable handler. The inline
  // effect re-subscribed on every render, and off(onBid) removed a different function than the
  // wrapper passed to on(), so listeners piled up (duplicate bids, updates on a blurred screen).
  const latest = useRef(onBid);
  useEffect(() => {
    latest.current = onBid;
  });
  useFocusEffect(
    useCallback(() => {
      const handler = (bid: Bid) => latest.current(bid);
      socket.on('bid', handler);
      return () => socket.off('bid', handler);
    }, [socket]),
  );
}

/** Calls `onForeground` when the app returns to the foreground (to resync the board). */
export function useOnForeground(onForeground: () => void) {
  const latest = useRef(onForeground);
  useEffect(() => {
    latest.current = onForeground;
  });
  useEffect(() => {
    // FIX: remove the subscription in the cleanup (it leaked one listener per callback change).
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') latest.current();
    });
    return () => sub.remove();
  }, []);
}
