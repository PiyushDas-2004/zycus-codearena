/**
 * One tab per assessment, using the Web Locks API (shared by all tabs and windows of this browser
 * profile). This protects data as well as integrity: two tabs would run two sync engines over the
 * same on-device copy. A second tab finds the lock taken and is blocked; "Use this tab instead"
 * steals the lock, and the first tab is told it lost it (its request rejects with AbortError).
 * A reload releases the lock with the page, so the reloaded page gets it back immediately.
 */
export interface TabLock {
  release: () => void;
}

export interface AcquireOptions {
  /** Take the lock from another tab that holds it. */
  steal?: boolean;
  /** Another tab took the lock from this one. */
  onLost: () => void;
}

const lockName = (sessionId: string) => `codearena:session:${sessionId}`;

/** Resolves to the lock, or null if another tab holds it (and `steal` was not set). */
export function acquireTabLock(sessionId: string, o: AcquireOptions): Promise<TabLock | null> {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  if (!locks) return Promise.resolve({ release: () => undefined }); // unsupported: allow (reported as degraded)

  return new Promise((resolve) => {
    let release: () => void = () => undefined;
    const held = new Promise<void>((r) => (release = r));
    let granted = false;
    locks
      .request(lockName(sessionId), o.steal ? { steal: true } : { ifAvailable: true }, async (lock) => {
        if (!lock) {
          resolve(null);
          return;
        }
        granted = true;
        resolve({ release });
        await held;
      })
      .catch((err: unknown) => {
        if ((err as DOMException).name === 'AbortError' && granted) o.onLost();
        else resolve(null);
      });
  });
}

export const tabLockSupported = () => typeof navigator !== 'undefined' && !!navigator.locks;
