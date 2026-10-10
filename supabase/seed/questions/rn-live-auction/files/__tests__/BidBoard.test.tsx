import React from 'react';
import { act, fireEvent, render } from '@codearena/test-utils';
import { renderCount, resetRenderCounts, totalRenders } from '../src/debug/renderCounter';
import { createAuctionSocket } from '../src/realtime/auctionSocket';
import { AuctionScreen } from '../src/screens/AuctionScreen';
import type { Bid } from '../src/types';

const bids: Bid[] = Array.from({ length: 30 }, (_, i) => ({
  id: `b${i}`,
  supplier: `Supplier ${i}`,
  amountMinor: 100_000 + i * 50,
}));

function renderScreen() {
  jest.useFakeTimers();
  const socket = createAuctionSocket();
  const utils = render(
    <AuctionScreen
      socket={socket}
      initialBids={bids}
      closesAt={Date.now() + 600_000}
      onPlaceBid={jest.fn()}
      onResync={jest.fn()}
    />,
  );
  resetRenderCounts();
  return { socket, ...utils };
}

describe('bid board performance', () => {
  it("rows don't re-render while the countdown ticks", () => {
    renderScreen();
    act(() => jest.advanceTimersByTime(3_000));
    expect(totalRenders('BidRow:')).toBe(0);
  });

  it('selecting a bid re-renders only the rows whose selection changed', () => {
    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId('bid-b5'));
    expect(renderCount('BidRow:b5')).toBe(1);
    expect(totalRenders('BidRow:')).toBe(1);

    fireEvent.press(getByTestId('bid-b7'));
    expect(totalRenders('BidRow:')).toBe(3); // b5 deselected, b7 selected
    expect(getByTestId('bid-b7-selected')).toBeTruthy();
  });

  it('a new bid that ranks last renders only its own row', () => {
    const { socket, getByTestId } = renderScreen();
    act(() => socket.emit('bid', { id: 'late', supplier: 'Late Co', amountMinor: 900_000 }));
    expect(getByTestId('bid-late')).toBeTruthy();
    expect(totalRenders('BidRow:')).toBe(1);
  });
});
