import { act, renderHook } from '@codearena/test-utils';
import type { HttpClient, RequestOptions } from '../src/api/httpClient';
import { useApprovals } from '../src/hooks/useApprovals';
import type { Approval, Filter } from '../src/types';

const item = (id: string, urgent = false): Approval => ({
  id,
  title: `Requisition ${id}`,
  amountMinor: 125_000,
  urgent,
  requestedBy: 'Priya',
  status: 'PENDING',
});
const ALL = [item('1'), item('2', true), item('3')];
const URGENT = [item('2', true)];
const MINE = [item('3')];

/** A fake client whose responses the test releases by hand, in any order. */
function fakeClient() {
  const requests = new Map<string, { resolve: (data: unknown) => void; signal?: AbortSignal }>();
  const get = jest.fn(
    (path: string, options: RequestOptions = {}) =>
      new Promise((resolve, reject) => {
        const abort = () => reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
        if (options.signal?.aborted) return abort();
        options.signal?.addEventListener('abort', abort);
        requests.set(path, { resolve, signal: options.signal });
      }),
  );
  return {
    client: { get, post: jest.fn() } as unknown as HttpClient,
    signalFor: (path: string) => requests.get(path)?.signal,
    async respond(path: string, data: unknown) {
      const request = requests.get(path);
      if (!request) throw new Error(`No request for ${path} reached the server (cancelled before it was sent?)`);
      await act(async () => request.resolve(data));
    },
  };
}

const render = (api: ReturnType<typeof fakeClient>) =>
  renderHook(({ filter }: { filter: Filter }) => useApprovals(api.client, filter), {
    initialProps: { filter: 'all' },
  });

describe('useApprovals', () => {
  it('loads the list for each filter chip', async () => {
    const api = fakeClient();
    const { result, rerender } = render(api);
    await api.respond('/approvals?filter=all', ALL);
    expect(result.current).toEqual({ items: ALL, loading: false, error: null });

    rerender({ filter: 'urgent' });
    expect(result.current.loading).toBe(true);
    await api.respond('/approvals?filter=urgent', URGENT);
    expect(result.current).toEqual({ items: URGENT, loading: false, error: null });

    rerender({ filter: 'mine' });
    await api.respond('/approvals?filter=mine', MINE);
    expect(result.current).toEqual({ items: MINE, loading: false, error: null });
  });

  it('ignores a slow response for a filter that is no longer selected', async () => {
    const api = fakeClient();
    const { result, rerender } = render(api);
    await api.respond('/approvals?filter=all', ALL);
    rerender({ filter: 'urgent' });
    rerender({ filter: 'mine' });
    await api.respond('/approvals?filter=mine', MINE);
    await api.respond('/approvals?filter=urgent', URGENT); // arrives late
    expect(result.current.items).toEqual(MINE);
    expect(api.signalFor('/approvals?filter=urgent')?.aborted).toBe(true);
  });

  it('cancels the request when the screen goes away', async () => {
    const api = fakeClient();
    const { unmount } = render(api);
    unmount();
    expect(api.signalFor('/approvals?filter=all')?.aborted).toBe(true);
  });
});
