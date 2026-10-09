/**
 * Face presence from webcam frames, using MediaPipe's BlazeFace (short range) detector running
 * entirely in the browser (WebAssembly). Only face COUNTS leave the device — no landmarks, no
 * identity, no embeddings. Model and runtime are self-hosted (no third-party requests).
 *
 * The model file is fetched once by `npm run models:fetch` into public/models/. If it is missing,
 * or WebAssembly/WebGL is unavailable, face detection is reported as degraded and the rest of
 * proctoring (camera on, snapshots) carries on.
 */
export const FACE_MODEL_PATH = '/models/blaze_face_short_range.tflite';

export type FaceEvent =
  | { type: 'no_face'; sinceMs: number }
  | { type: 'face_back'; missingMs: number }
  | { type: 'multiple_faces'; count: number };

/**
 * Turns per-frame face counts into events:
 * - no_face once no face has been seen for `noFaceMs` (then re-arms when a face returns);
 * - multiple_faces after `multiConsecutive` consecutive frames with 2+ faces, at most once per
 *   `cooldownMs`.
 */
export class FacePresence {
  private noFaceSince: number | null = null;
  private noFaceReported = false;
  private multiStreak = 0;
  private lastMultiAt = -Infinity;

  constructor(
    private readonly noFaceMs: number,
    private readonly multiConsecutive: number,
    private readonly cooldownMs = 30_000,
  ) {}

  /** Forget the current streaks (e.g. the camera was off, so frames are not comparable). */
  reset() {
    this.noFaceSince = null;
    this.noFaceReported = false;
    this.multiStreak = 0;
  }

  update(count: number, now: number): FaceEvent[] {
    const out: FaceEvent[] = [];
    if (count === 0) {
      this.noFaceSince ??= now;
      if (!this.noFaceReported && now - this.noFaceSince >= this.noFaceMs) {
        this.noFaceReported = true;
        out.push({ type: 'no_face', sinceMs: now - this.noFaceSince });
      }
    } else {
      if (this.noFaceReported && this.noFaceSince !== null) {
        out.push({ type: 'face_back', missingMs: now - this.noFaceSince });
      }
      this.noFaceSince = null;
      this.noFaceReported = false;
    }

    if (count >= 2) {
      this.multiStreak++;
      if (this.multiStreak >= this.multiConsecutive && now - this.lastMultiAt >= this.cooldownMs) {
        this.lastMultiAt = now;
        out.push({ type: 'multiple_faces', count });
      }
    } else {
      this.multiStreak = 0;
    }
    return out;
  }
}

export interface FaceCounter {
  count(video: HTMLVideoElement, timestampMs: number): number;
  close(): void;
}

/** Loads the detector lazily (≈12 MB WebAssembly, cached by the browser). Null if unavailable. */
export async function loadFaceCounter(): Promise<{ counter: FaceCounter } | { error: string }> {
  try {
    // Missing static files fall back to index.html (SPA routing), so check the type too.
    const head = await fetch(FACE_MODEL_PATH, { method: 'HEAD' });
    if (!head.ok || /text\/html/i.test(head.headers.get('content-type') ?? ''))
      return { error: 'model_missing' };
    const [{ FaceDetector }, loader, binary] = await Promise.all([
      import('@mediapipe/tasks-vision'),
      import('@mediapipe/tasks-vision/vision_wasm_internal.js?url'),
      import('@mediapipe/tasks-vision/vision_wasm_internal.wasm?url'),
    ]);
    const fileset = { wasmLoaderPath: loader.default, wasmBinaryPath: binary.default };
    const create = (delegate: 'GPU' | 'CPU') =>
      FaceDetector.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: FACE_MODEL_PATH, delegate },
        runningMode: 'VIDEO',
        minDetectionConfidence: 0.6,
      });
    const detector = await create('GPU').catch(() => create('CPU'));
    let lastTs = 0;
    return {
      counter: {
        count(video, timestampMs) {
          // detectForVideo requires strictly increasing timestamps.
          const ts = Math.max(timestampMs, lastTs + 1);
          lastTs = ts;
          return detector.detectForVideo(video, ts).detections.length;
        },
        close: () => detector.close(),
      },
    };
  } catch (err) {
    return { error: (err as Error).name === 'TypeError' ? 'runtime_unavailable' : 'load_failed' };
  }
}
