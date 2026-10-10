import { act, renderHook } from '@codearena/test-utils';
import { useCountdown } from '../src/hooks/useCountdown';

const T0 = Date.UTC(2026, 9, 12, 11, 0, 0);

describe('useCountdown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(T0);
  });

  it('counts down every second and closes at zero', () => {
    const { result } = renderHook(() => useCountdown(T0 + 3_000));
    expect(result.current).toEqual({ remaining: 3_000, closed: false });
    act(() => jest.advanceTimersByTime(1_000));
    expect(result.current.remaining).toBe(2_000);
    act(() => jest.advanceTimersByTime(2_000));
    expect(result.current).toEqual({ remaining: 0, closed: true });
  });

  it('picks up an extension of the closing time immediately', () => {
    const { result, rerender } = renderHook(({ closesAt }: { closesAt: number }) => useCountdown(closesAt), {
      initialProps: { closesAt: T0 + 30_000 },
    });
    act(() => jest.advanceTimersByTime(25_000));
    expect(result.current.remaining).toBe(5_000);

    // A bid in the final minute extended the auction by 2 minutes.
    rerender({ closesAt: T0 + 150_000 });
    expect(result.current.remaining).toBe(125_000);
    act(() => jest.advanceTimersByTime(10_000));
    expect(result.current).toEqual({ remaining: 115_000, closed: false });
  });

  it('is right again as soon as the app returns from the background', () => {
    const { result } = renderHook(() => useCountdown(T0 + 600_000));
    act(() => jest.advanceTimersByTime(5_000));
    expect(result.current.remaining).toBe(595_000);

    // In the background JS timers are paused, but real time moves on: 3 minutes pass.
    jest.setSystemTime(T0 + 185_000);
    act(() => jest.advanceTimersByTime(1_000));
    expect(result.current.remaining).toBe(600_000 - 186_000);
  });
});
