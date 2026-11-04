/**
 * Warms the browser cache for the workspace while the candidate reads the instructions, so the code
 * editor (≈1 MB) and on-device face detection (≈12 MB WebAssembly) are ready the moment they press
 * Start. Runs when the browser is idle, at low network priority, one file at a time, and is skipped
 * when the user has asked to save data. Failures are ignored: this is only an optimisation.
 */
import { prefetchWorkerUrls } from './editor/workerUrls';

let started = false;

const whenIdle = (fn: () => void) => {
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(fn, { timeout: 4000 });
  else setTimeout(fn, 1500);
};

const warm = (url: string) =>
  fetch(url, { priority: 'low' })
    .then((r) => r.arrayBuffer())
    .catch(() => undefined);

export function prefetchWorkspace(o: { faceDetection: boolean }) {
  if (started) return;
  started = true;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return;

  whenIdle(() => {
    void (async () => {
      await import('./WorkspaceRoute').catch(() => undefined); // editor code (cached for the route)
      for (const url of prefetchWorkerUrls) await warm(url);
      if (o.faceDetection) {
        const { faceRuntimeUrls } = await import('../proctoring/faceMonitor');
        const urls = await faceRuntimeUrls();
        await import('@mediapipe/tasks-vision').catch(() => undefined);
        for (const url of [urls.loader, urls.model, urls.binary]) await warm(url);
      }
    })();
  });
}
