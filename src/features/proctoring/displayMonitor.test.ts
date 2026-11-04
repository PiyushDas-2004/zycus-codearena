/**
 * Multi-monitor detection: the system check refuses to start unless one display is confirmed, and
 * during the assessment a second display is noticed (by the screen `change` event or by polling,
 * since plugging a monitor in doesn't always fire it).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { displayCheck } from '../candidate/displayCheck';
import { installDisplayMonitor } from './displayMonitor';
import { VIOLATION_COPY } from './violationPolicy';

let extended: boolean | undefined;
const EVENT_METHODS = ['addEventListener', 'removeEventListener', 'dispatchEvent'] as const;
const fireScreenChange = () => (window.screen as Screen & EventTarget).dispatchEvent(new Event('change'));
beforeEach(() => {
  extended = false;
  Object.defineProperty(window.screen, 'isExtended', { configurable: true, get: () => extended });
  // In Chrome the screen is an EventTarget; in jsdom it isn't.
  const target = new EventTarget();
  for (const m of EVENT_METHODS) {
    Object.defineProperty(window.screen, m, { configurable: true, value: target[m].bind(target) });
  }
  vi.useFakeTimers();
});
afterEach(() => {
  for (const key of ['isExtended', ...EVENT_METHODS]) Reflect.deleteProperty(window.screen, key);
  vi.useRealTimers();
});

describe('installDisplayMonitor', () => {
  it('reports a second display found by polling, and when it is gone', () => {
    const onChange = vi.fn();
    const stop = installDisplayMonitor({ pollMs: 5000, onChange, onUnsupported: vi.fn() });
    expect(onChange).not.toHaveBeenCalled(); // one display: nothing to report

    extended = true;
    vi.advanceTimersByTime(5000);
    expect(onChange).toHaveBeenLastCalledWith(true);
    vi.advanceTimersByTime(20_000);
    expect(onChange).toHaveBeenCalledTimes(1); // reported once, not on every poll

    extended = false;
    vi.advanceTimersByTime(5000);
    expect(onChange).toHaveBeenLastCalledWith(false);
    stop();
  });

  it('reacts at once to the screen change event', () => {
    const onChange = vi.fn();
    const stop = installDisplayMonitor({ pollMs: 60_000, onChange, onUnsupported: vi.fn() });
    extended = true;
    fireScreenChange();
    expect(onChange).toHaveBeenCalledWith(true);
    stop();
  });

  it('reports a second display that is already connected when it starts', () => {
    extended = true;
    const onChange = vi.fn();
    const stop = installDisplayMonitor({ pollMs: 5000, onChange, onUnsupported: vi.fn() });
    expect(onChange).toHaveBeenCalledWith(true);
    stop();
  });

  it('stops polling when uninstalled', () => {
    const onChange = vi.fn();
    installDisplayMonitor({ pollMs: 5000, onChange, onUnsupported: vi.fn() })();
    extended = true;
    vi.advanceTimersByTime(30_000);
    fireScreenChange();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('says so when the browser cannot tell', () => {
    extended = undefined;
    const onUnsupported = vi.fn();
    installDisplayMonitor({ pollMs: 5000, onChange: vi.fn(), onUnsupported });
    expect(onUnsupported).toHaveBeenCalledOnce();
  });
});

describe('displayCheck (system check)', () => {
  it('passes one display and fails two', () => {
    expect(displayCheck(false, true).status).toBe('pass');
    expect(displayCheck(true, true)).toMatchObject({
      status: 'fail',
      detail: /Disconnect the extra monitor/,
    });
    expect(displayCheck(true, false).status).toBe('fail');
  });

  it('fails a browser that cannot confirm one display when extended desktops are blocked', () => {
    expect(displayCheck(null, true)).toMatchObject({ status: 'fail', detail: /Chrome or Microsoft Edge/ });
    expect(displayCheck(null, false).status).toBe('warn');
  });

  it('never suggests mirroring the screen (that would let someone else watch)', () => {
    const texts = [
      displayCheck(true, true).detail,
      displayCheck(null, true).detail,
      VIOLATION_COPY.multi_monitor?.body ?? '',
    ];
    for (const text of texts) expect(text).not.toMatch(/mirror|duplicate/i);
    expect(VIOLATION_COPY.multi_monitor?.body).toMatch(/Disconnect/);
  });
});
