/**
 * The 3D gradient noise every surface in the journey is built from, computed once on the CPU and
 * stored as a small tileable 3D texture (64³, half floats, 512 KB). Shaders then read noise with one
 * texture fetch instead of evaluating it, which keeps them small: on Windows, browsers translate
 * WebGL shaders for Direct3D, and noise-heavy shaders can otherwise take many seconds to prepare.
 *
 * Sampling the texture at p / NOISE_PERIOD gives gradient noise of p (about −1…1), repeating every
 * NOISE_PERIOD units.
 */
export const NOISE_SIZE = 64;
export const NOISE_PERIOD = 16;

function toHalf(v: number): number {
  const f = new Float32Array([v]);
  const x = new Uint32Array(f.buffer)[0] ?? 0;
  const sign = (x >>> 16) & 0x8000;
  const exp = ((x >>> 23) & 0xff) - 127 + 15;
  const mant = x & 0x7fffff;
  if (exp <= 0) return sign;
  if (exp >= 31) return sign | 0x7c00;
  return sign | (exp << 10) | (mant >>> 13);
}

export function bakeNoise(rand: () => number): Uint16Array {
  const P = NOISE_PERIOD;
  const grads = new Float32Array(P * P * P * 3);
  // Random unit gradients (uniform over the sphere: rejection sampling in the unit ball).
  const unit = (): [number, number, number] => {
    for (;;) {
      const x = rand() * 2 - 1;
      const y = rand() * 2 - 1;
      const z = rand() * 2 - 1;
      const l = Math.hypot(x, y, z);
      if (l <= 1 && l >= 0.05) return [x / l, y / l, z / l];
    }
  };
  for (let i = 0; i < P * P * P; i++) grads.set(unit(), i * 3);
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const corner = (ix: number, iy: number, iz: number, fx: number, fy: number, fz: number) => {
    const k = (((iz % P) * P + (iy % P)) * P + (ix % P)) * 3;
    return (grads[k] ?? 0) * fx + (grads[k + 1] ?? 0) * fy + (grads[k + 2] ?? 0) * fz;
  };
  const N = NOISE_SIZE;
  const out = new Uint16Array(N * N * N);
  for (let z = 0; z < N; z++)
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        // The texel centre, in lattice units.
        const px = ((x + 0.5) / N) * P;
        const py = ((y + 0.5) / N) * P;
        const pz = ((z + 0.5) / N) * P;
        const ix = Math.floor(px);
        const iy = Math.floor(py);
        const iz = Math.floor(pz);
        const fx = px - ix;
        const fy = py - iy;
        const fz = pz - iz;
        const u = fade(fx);
        const v = fade(fy);
        const w = fade(fz);
        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
        const n = lerp(
          lerp(
            lerp(corner(ix, iy, iz, fx, fy, fz), corner(ix + 1, iy, iz, fx - 1, fy, fz), u),
            lerp(corner(ix, iy + 1, iz, fx, fy - 1, fz), corner(ix + 1, iy + 1, iz, fx - 1, fy - 1, fz), u),
            v,
          ),
          lerp(
            lerp(corner(ix, iy, iz + 1, fx, fy, fz - 1), corner(ix + 1, iy, iz + 1, fx - 1, fy, fz - 1), u),
            lerp(
              corner(ix, iy + 1, iz + 1, fx, fy - 1, fz - 1),
              corner(ix + 1, iy + 1, iz + 1, fx - 1, fy - 1, fz - 1),
              u,
            ),
            v,
          ),
          w,
        );
        out[(z * N + y) * N + x] = toHalf(n * 1.6);
      }
  return out;
}
