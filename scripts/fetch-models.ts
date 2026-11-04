/**
 * Downloads the face-detection model into public/models/ and verifies it, so the app never calls a
 * third party at runtime. Run once; commit the file (builds and deployments are then self-contained).
 *
 *   npm run models:fetch
 *
 * Model: MediaPipe BlazeFace short-range (float16), © Google, Apache License 2.0.
 * https://ai.google.dev/edge/mediapipe/solutions/vision/face_detector
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '..');

const MODELS = [
  {
    url: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
    file: join(ROOT, 'public', 'models', 'blaze_face_short_range.tflite'),
    bytes: 229_746,
    /** MD5 published by Google Cloud Storage for this object (x-goog-hash header). */
    md5Base64: 'o91uwxclKQdwuXzsDL+UyQ==',
    /** Pinned from the first verified download (2026-10-09). */
    sha256: 'b4578f35940bf5a1a655214a1cce5cab13eba73c1297cd78e1a04c2380b0152f',
  },
];

function verify(buf: Buffer, m: (typeof MODELS)[number]): string | null {
  if (buf.length !== m.bytes) return `size ${buf.length} ≠ expected ${m.bytes}`;
  const md5 = createHash('md5').update(buf).digest('base64');
  if (md5 !== m.md5Base64) return `MD5 ${md5} ≠ expected ${m.md5Base64}`;
  const sha256 = createHash('sha256').update(buf).digest('hex');
  if (sha256 !== m.sha256) return `SHA-256 ${sha256} ≠ expected ${m.sha256}`;
  return null;
}

let failed = false;
for (const m of MODELS) {
  const name = relative(ROOT, m.file);
  if (existsSync(m.file) && verify(readFileSync(m.file), m) === null) {
    console.log(`✔ ${name} already present and verified`);
    continue;
  }
  const res = await fetch(m.url);
  if (!res.ok) {
    console.error(`✖ ${name}: HTTP ${res.status} from ${m.url}`);
    failed = true;
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const problem = verify(buf, m);
  if (problem) {
    console.error(`✖ ${name}: verification failed (${problem}); not saved`);
    failed = true;
    continue;
  }
  mkdirSync(dirname(m.file), { recursive: true });
  writeFileSync(m.file, buf);
  console.log(`✔ ${name} (${buf.length} bytes, SHA-256 verified)`);
}
// exitCode, not process.exit(): exiting while fetch sockets close crashes Node on Windows.
process.exitCode = failed ? 1 : 0;
