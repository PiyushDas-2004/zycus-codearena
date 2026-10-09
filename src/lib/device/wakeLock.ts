/**
 * Keeps the screen awake for the whole test (Screen Wake Lock API). Browsers release the lock
 * whenever the page is hidden, so it is re-acquired every time the page becomes visible again.
 * It cannot stop a laptop lid from closing; that shows up as a heartbeat gap for reviewers.
 */
export class WakeLockKeeper {
  private sentinel: WakeLockSentinel | null = null;
  private active = false;
  private readonly onVisibility = () => {
    if (this.active && document.visibilityState === 'visible') void this.acquire();
  };

  constructor(private readonly onUnavailable?: (reason: string) => void) {}

  get supported(): boolean {
    return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  }

  get held(): boolean {
    return !!this.sentinel && !this.sentinel.released;
  }

  async start(): Promise<void> {
    this.active = true;
    document.addEventListener('visibilitychange', this.onVisibility);
    await this.acquire();
  }

  async stop(): Promise<void> {
    this.active = false;
    document.removeEventListener('visibilitychange', this.onVisibility);
    const s = this.sentinel;
    this.sentinel = null;
    await s?.release().catch(() => undefined);
  }

  private async acquire(): Promise<void> {
    if (!this.supported) {
      this.onUnavailable?.('unsupported');
      return;
    }
    if (this.held || document.visibilityState !== 'visible') return;
    try {
      this.sentinel = await navigator.wakeLock.request('screen');
    } catch (err) {
      this.onUnavailable?.((err as Error).name || 'denied');
    }
  }
}
