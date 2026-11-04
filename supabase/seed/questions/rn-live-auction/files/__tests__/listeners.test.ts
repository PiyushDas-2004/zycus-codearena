import { act, appState, navigation, renderHook } from '@codearena/test-utils';
import { useBidFeed, useOnForeground } from '../src/hooks/useAuctionListeners';
import { createAuctionSocket } from '../src/realtime/auctionSocket';
import type { Bid } from '../src/types';

const bid: Bid = { id: 'b9', supplier: 'Acme Metals', amountMinor: 99_995 };

describe('live bid feed', () => {
  it('has exactly one listener while focused, however often the screen re-renders', () => {
    const socket = createAuctionSocket();
    const { rerender } = renderHook(({ onBid }: { onBid: (b: Bid) => void }) => useBidFeed(socket, onBid), {
      initialProps: { onBid: jest.fn() },
    });
    for (let i = 0; i < 5; i++) rerender({ onBid: jest.fn() });
    expect(socket.listenerCount('bid')).toBe(1);
  });

  it('delivers each bid once, to the latest callback', () => {
    const socket = createAuctionSocket();
    const first = jest.fn();
    const latest = jest.fn();
    const { rerender } = renderHook(({ onBid }: { onBid: (b: Bid) => void }) => useBidFeed(socket, onBid), {
      initialProps: { onBid: first },
    });
    rerender({ onBid: latest });
    act(() => socket.emit('bid', bid));
    expect(latest).toHaveBeenCalledTimes(1);
    expect(latest).toHaveBeenCalledWith(bid);
    expect(first).not.toHaveBeenCalled();
  });

  it('moves its listener to a new socket (after a reconnect)', () => {
    const before = createAuctionSocket();
    const after = createAuctionSocket();
    const onBid = jest.fn();
    const { rerender } = renderHook(({ socket }: { socket: typeof before }) => useBidFeed(socket, onBid), {
      initialProps: { socket: before },
    });
    rerender({ socket: after });
    expect(before.listenerCount('bid')).toBe(0);
    expect(after.listenerCount('bid')).toBe(1);
    act(() => after.emit('bid', bid));
    expect(onBid).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes when the screen loses focus and when it unmounts', () => {
    const socket = createAuctionSocket();
    const { unmount } = renderHook(() => useBidFeed(socket, jest.fn()));
    expect(socket.listenerCount('bid')).toBe(1);
    navigation.blur();
    expect(socket.listenerCount('bid')).toBe(0);
    navigation.focus();
    expect(socket.listenerCount('bid')).toBe(1);
    unmount();
    expect(socket.listenerCount('bid')).toBe(0);
  });
});

describe('foreground resync', () => {
  it('keeps one AppState listener and removes it on unmount', () => {
    const { rerender, unmount } = renderHook(({ cb }: { cb: () => void }) => useOnForeground(cb), {
      initialProps: { cb: jest.fn() },
    });
    for (let i = 0; i < 3; i++) rerender({ cb: jest.fn() });
    expect(appState.listenerCount()).toBe(1);
    unmount();
    expect(appState.listenerCount()).toBe(0);
  });

  it('calls the latest callback once when the app becomes active', () => {
    const first = jest.fn();
    const latest = jest.fn();
    const { rerender } = renderHook(({ cb }: { cb: () => void }) => useOnForeground(cb), {
      initialProps: { cb: first },
    });
    rerender({ cb: latest });
    appState.set('background');
    appState.set('active');
    expect(latest).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
  });
});
