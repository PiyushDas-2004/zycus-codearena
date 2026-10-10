import { useFocusEffect } from '@react-navigation/native';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import type { AuctionSocket } from '../realtime/auctionSocket';
import type { Bid } from '../types';

/** Live bids for the auction, only while this screen is focused (saves battery and data). */
export function useBidFeed(socket: AuctionSocket, onBid: (bid: Bid) => void) {
  useFocusEffect(() => {
    socket.on('bid', (bid) => onBid(bid));
    return () => socket.off('bid', onBid);
  });
}

/** Calls `onForeground` when the app returns to the foreground (to resync the board). */
export function useOnForeground(onForeground: () => void) {
  useEffect(() => {
    AppState.addEventListener('change', (state) => {
      if (state === 'active') onForeground();
    });
  }, [onForeground]);
}
