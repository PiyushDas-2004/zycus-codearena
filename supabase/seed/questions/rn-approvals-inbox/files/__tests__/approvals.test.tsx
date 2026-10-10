import { act, deferred, flushPromises, renderHook } from '@codearena/test-utils';
import { useApprovalDecisions } from '../src/state/approvals';
import type { Approval } from '../src/types';

const make = (id: string, status: Approval['status'] = 'PENDING'): Approval => ({
  id,
  title: `Invoice ${id}`,
  amountMinor: 99_900,
  urgent: false,
  requestedBy: 'Arjun',
  status,
});

function serverWithManualReplies() {
  const replies = new Map<string, ReturnType<typeof deferred>>();
  const post = jest.fn((path: string) => {
    const reply = deferred();
    replies.set(path, reply);
    return reply.promise;
  });
  return { api: { post } as never, reply: (path: string) => replies.get(path)! };
}

const statusOf = (items: Approval[], id: string) => items.find((a) => a.id === id);

describe('optimistic approve / reject', () => {
  it('rolls back only the decision that failed', async () => {
    const { api, reply } = serverWithManualReplies();
    const { result } = renderHook(() => useApprovalDecisions(api, [make('A'), make('B'), make('C')]));
    act(() => void result.current.decide('A', 'APPROVED'));
    act(() => void result.current.decide('B', 'APPROVED'));
    expect(result.current.items.map((a) => a.status)).toEqual(['APPROVED', 'APPROVED', 'PENDING']);

    await act(async () => reply('/approvals/A/approve').reject(new Error('Network request failed')));
    await act(async () => reply('/approvals/B/approve').resolve({}));
    await flushPromises();

    expect(statusOf(result.current.items, 'A')).toMatchObject({ status: 'PENDING', error: expect.any(String) });
    expect(statusOf(result.current.items, 'B')).toMatchObject({ status: 'APPROVED' });
    expect(statusOf(result.current.items, 'B')?.error).toBeUndefined();
  });

  it('keeps a later success when an earlier request fails afterwards', async () => {
    const { api, reply } = serverWithManualReplies();
    const { result } = renderHook(() => useApprovalDecisions(api, [make('A'), make('B')]));
    act(() => void result.current.decide('A', 'REJECTED'));
    act(() => void result.current.decide('B', 'APPROVED'));
    await act(async () => reply('/approvals/B/approve').resolve({}));
    await act(async () => reply('/approvals/A/reject').reject(new Error('timeout')));
    await flushPromises();
    expect(result.current.items.map((a) => a.status)).toEqual(['PENDING', 'APPROVED']);
  });

  it('a failed change returns the row to the status it had before', async () => {
    const { api, reply } = serverWithManualReplies();
    const { result } = renderHook(() => useApprovalDecisions(api, [make('A', 'APPROVED')]));
    act(() => void result.current.decide('A', 'REJECTED'));
    await act(async () => reply('/approvals/A/reject').reject(new Error('409 Conflict')));
    await flushPromises();
    expect(statusOf(result.current.items, 'A')).toMatchObject({ status: 'APPROVED', error: expect.any(String) });
  });
});
