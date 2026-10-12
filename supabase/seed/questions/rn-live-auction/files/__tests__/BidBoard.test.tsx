import React from 'react';
import * as RN from 'react-native';
import { act, fireEvent, render, textContent } from '@codearena/test-utils';
import { renderCount, resetRenderCounts, totalRenders } from '../src/debug/renderCounter';
import { createAuctionSocket } from '../src/realtime/auctionSocket';
import { AuctionScreen } from '../src/screens/AuctionScreen';
import type { Bid } from '../src/types';

const bids: Bid[] = Array.from({ length: 30 }, (_, i) => ({
  id: `b${i}`,
  supplier: `Supplier ${i}`,
  amountMinor: 100_000 + i * 50,
}));

/**
 * Row renders as React performs them: each row's amount <Text testID="bid-<id>-amount"> counts
 * itself, whatever the row's own code does.
 */
const rowRenders: string[] = [];
const OriginalText = RN.Text;
const reactNative = RN as unknown as { Text: unknown };
function CountingText(props: React.ComponentProps<typeof OriginalText>) {
  const id = /^bid-(.+)-amount$/.exec(String(props.testID ?? ''))?.[1];
  if (id) rowRenders.push(id);
  return <OriginalText {...props} />;
}
afterEach(() => {
  reactNative.Text = OriginalText;
});

function renderScreen() {
  jest.useFakeTimers();
  reactNative.Text = CountingText;
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
  rowRenders.length = 0;
  return { socket, ...utils };
}

const rankOf = (node: Parameters<typeof textContent>[0]) => /#(\d+)/.exec(textContent(node))?.[1];

describe('bid board performance', () => {
  it("rows don't re-render while the countdown ticks", () => {
    renderScreen();
    act(() => jest.advanceTimersByTime(3_000));
    expect(totalRenders('BidRow:')).toBe(0);
    expect(rowRenders).toEqual([]);
  });

  it('selecting a bid re-renders only the rows whose selection changed', () => {
    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId('bid-b5'));
    expect(renderCount('BidRow:b5')).toBe(1);
    expect(totalRenders('BidRow:')).toBe(1);
    expect(rowRenders).toEqual(['b5']);

    fireEvent.press(getByTestId('bid-b7'));
    expect(totalRenders('BidRow:')).toBe(3); // b5 deselected, b7 selected
    expect([...rowRenders].sort()).toEqual(['b5', 'b5', 'b7']);
    expect(getByTestId('bid-b7-selected')).toBeTruthy();
  });

  it('a new bid that ranks last renders only its own row', () => {
    const { socket, getByTestId } = renderScreen();
    act(() => socket.emit('bid', { id: 'late', supplier: 'Late Co', amountMinor: 900_000 }));
    expect(getByTestId('bid-late')).toBeTruthy();
    expect(totalRenders('BidRow:')).toBe(1);
    expect(rowRenders).toEqual(['late']);
  });

  it('a new best bid becomes #1 and moves every other bid down', () => {
    const { socket, getByTestId } = renderScreen();
    act(() => socket.emit('bid', { id: 'best', supplier: 'Best Co', amountMinor: 90_000 }));
    expect(rankOf(getByTestId('bid-best'))).toBe('1');
    expect(rankOf(getByTestId('bid-b0'))).toBe('2');
    expect(rankOf(getByTestId('bid-b29'))).toBe('31');
  });
});
