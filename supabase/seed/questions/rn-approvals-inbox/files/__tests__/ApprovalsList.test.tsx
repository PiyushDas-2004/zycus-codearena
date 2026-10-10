import React from 'react';
import { fireEvent, render } from '@codearena/test-utils';
import { ApprovalsList, getItemLayout, ROW_HEIGHT, SEPARATOR_HEIGHT } from '../src/screens/ApprovalsList';
import type { Approval } from '../src/types';

const make = (id: string): Approval => ({
  id,
  title: `PO ${id}`,
  amountMinor: 500_000,
  urgent: false,
  requestedBy: 'Meera',
  status: 'PENDING',
});
const [A, B, C] = [make('A'), make('B'), make('C')];

describe('ApprovalsList', () => {
  it('scrollToIndex lands on the right row (rows are separated by a 1 pt line)', () => {
    expect(getItemLayout([], 0)).toEqual({ length: ROW_HEIGHT, offset: 0, index: 0 });
    expect(getItemLayout([], 7)).toEqual({ length: ROW_HEIGHT, offset: 7 * (ROW_HEIGHT + SEPARATOR_HEIGHT), index: 7 });
  });

  it('keeps the expanded row expanded when a row above it disappears', () => {
    const onDecide = jest.fn();
    const { getByTestId, queryByTestId, rerender } = render(<ApprovalsList items={[A, B, C]} onDecide={onDecide} />);
    fireEvent.press(getByTestId('row-B-toggle'));
    expect(queryByTestId('row-B-details')).not.toBeNull();

    rerender(<ApprovalsList items={[B, C]} onDecide={onDecide} />); // A was approved elsewhere
    expect(queryByTestId('row-B-details')).not.toBeNull();
    expect(queryByTestId('row-C-details')).toBeNull();
  });

  it("keeps each row's comment with its own row", () => {
    const onDecide = jest.fn();
    const { getByTestId, rerender } = render(<ApprovalsList items={[A, B, C]} onDecide={onDecide} />);
    fireEvent.press(getByTestId('row-B-toggle'));
    fireEvent.changeText(getByTestId('row-B-comment'), 'Over budget');

    rerender(<ApprovalsList items={[B, C]} onDecide={onDecide} />);
    expect(getByTestId('row-B-comment').props.value).toBe('Over budget');
    fireEvent.press(getByTestId('row-B-reject'));
    expect(onDecide).toHaveBeenCalledWith('B', 'REJECTED', 'Over budget');
  });
});
