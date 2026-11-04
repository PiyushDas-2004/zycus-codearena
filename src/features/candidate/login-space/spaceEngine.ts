/**
 * The sign-in page's background: an endless, realistic journey through space, on pure black. Raw
 * WebGL2, no dependencies. A director (journey.ts) strings legs together — planet fly-bys, jumps to
 * light speed, nebulae, asteroid belts, galaxy vistas, passing comets — and the camera turns as it
 * travels, so the whole sky is alive. Nothing is a video and nothing loops.
 *
 * Rendering is HDR: the sky (a baked cube map of the Milky Way), far galaxies and stars, the nearest
 * star, nebula billboards, nearby stars with motion blur, ray-traced planets (baked surfaces,
 * atmospheres, rings and their shadows), asteroids and comets; then bloom and ACES tone mapping.
 *
 * It leaves the machine alone: device pixel ratio capped, lower resolution if the first frames are
 * slow, paused while the tab is hidden, and dispose() frees every GPU object and loses the context.
 */
import { BODY, createJourney, type Leg } from './journey';
import { NOISE_SIZE, bakeNoise } from './noise';
import * as S from './spaceShaders';

export interface SpaceEngineOptions {
  canvas: HTMLCanvasElement;
  reduced: boolean;
  /** The free area beside the card: the journey heads towards its centre (else the screen's). */
  focus?: HTMLElement | null;
}

export interface SpaceEngine {
  dispose(): void;
}

type V3 = [number, number, number];
type M4 = Float32Array;

const MAX_DPR = 1.25;
const NEAR_STARS = 8000;
const SKY_STARS = 9000;
const CUBE = 300;
const SKY_SIZE = 768;
const NEBULA_SIZE = 1024;
const MAX_NEBULAE = 24;
const MAX_ROCKS = 700;
/** Rocks fade in from this distance. */
const ROCK_FAR = 420;
const CLUSTER_STARS = 2200;
const SHUTTER = 0.035;
const FOV = 52;
/** The star field never streaks faster than this (beyond it, the motion would only flicker). */
const STREAK_SPEED = 260;
/** A planet first appears this many radii away (a dot), and the approach slows as it grows. */
const APPROACH_RADII = 1400;
/** How far away (in radii) the first world of the first tour starts, as the page opens. */
const OPENING_RADII = 40;
/**
 * Near a world, distances are in units of how far away it passes (its `pass`): the fast approach
 * ends NEAR_END passes ahead and the world is big NEAR_BIG passes before that; then we drift past at
 * DRIFT passes a second (the view turns about 15° a second as we sweep by).
 */
const NEAR_END = 0.9;
const NEAR_BIG = 0.8;
const DRIFT = 0.26;
/** Seconds before the end of a world's leg that it is big, and that we speed off. */
const BIG_BEFORE_END = 10.5;
const SPEED_OFF = 2.0;
/**
 * How the camera turns with a world θ radians from the direction of travel: not at all until
 * TRACK_FROM, then gradually (over TRACK_IN) until it turns as fast as the world moves, holding it
 * still on screen TRACK_FROM + TRACK_IN / 2 (3.4°) out from the middle of the free side; from
 * TRACK_HOLD it eases (over TRACK_OUT) to a stop, turned about 48° in all, and the world glides off
 * the left of the view.
 */
const TRACK_FROM = 0.02;
const TRACK_IN = 0.08;
const TRACK_HOLD = 0.75;
const TRACK_OUT = 0.28;
/**
 * Once the world is this far round (radians, ≈ 85°), it has left the view: the camera holds still and
 * the course turns onto the way it is looking over TURN_BACK s, before we speed off.
 */
const PASSED = 1.48;
const TURN_BACK = 2.8;
/** The integral of smoothstep over [0, x]. */
const smoothRamp = (x: number) => (x <= 0 ? 0 : x >= 1 ? x - 0.5 : x * x * x - (x * x * x * x) / 2);
const trackTurn = (theta: number) =>
  TRACK_IN * smoothRamp((theta - TRACK_FROM) / TRACK_IN) -
  TRACK_OUT * smoothRamp((theta - TRACK_HOLD) / TRACK_OUT);
/** Rows of a planet texture baked per frame, in the background. */
const BAKE_ROWS = 64;
/** Seconds over which what a jump leaves behind fades out. */
const FADE_OUT = 1.4;

// ── Small vector and matrix helpers ──────────────────────────────────────────────────────────────
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const norm = (a: V3): V3 => mul(a, 1 / (len(a) || 1));
const mix3 = (...terms: [V3, number][]): V3 =>
  norm(terms.reduce<V3>((s, [v, k]) => add(s, mul(v, k)), [0, 0, 0]));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (a: number, b: number, t: number) => {
  const x = clamp01((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};

function perspective(fovY: number, aspect: number, shiftX: number, near: number, far: number): M4 {
  const f = 1 / Math.tan(fovY / 2);
  const m = new Float32Array(16);
  m[0] = f / aspect;
  m[5] = f;
  m[8] = -shiftX;
  m[10] = (far + near) / (near - far);
  m[11] = -1;
  m[14] = (2 * far * near) / (near - far);
  return m;
}
function multiply(a: M4, b: M4): M4 {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += (a[k * 4 + r] ?? 0) * (b[c * 4 + k] ?? 0);
      o[c * 4 + r] = s;
    }
  return o;
}
/** World → view (rotation only) from the camera basis. */
function viewRotation(r: V3, u: V3, f: V3): M4 {
  return new Float32Array([r[0], u[0], -f[0], 0, r[1], u[1], -f[1], 0, r[2], u[2], -f[2], 0, 0, 0, 0, 1]);
}
/** Rotation (column-major mat3) taking world vectors into an object's frame. */
function frame(axis: V3, spin: number): Float32Array {
  const y = norm(axis);
  const ref: V3 = Math.abs(y[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const x0 = norm(cross(ref, y));
  const z0 = cross(x0, y);
  const c = Math.cos(spin);
  const s = Math.sin(spin);
  const x = add(mul(x0, c), mul(z0, s));
  const z = add(mul(z0, c), mul(x0, -s));
  // Rows are the frame's axes, so (M * v) gives v's coordinates in that frame.
  return new Float32Array([x[0], y[0], z[0], x[1], y[1], z[1], x[2], y[2], z[2]]);
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Scene objects ────────────────────────────────────────────────────────────────────────────────
type Atmo = [number, number, number, number];
interface Planet {
  pos: V3;
  radius: number;
  kind: number;
  axis: V3;
  period: number;
  phase: number;
  atmo: Atmo;
  ring?: { inner: number; outer: number; opacity: number; normal: V3; facing?: boolean };
  /** When it appeared, when its surface was first drawn (it fades in from then), and when it began
   * fading out (a jump leaves it behind). */
  born: number;
  texAt?: number;
  gone?: number;
}
/** A world's textures: its surface, Earth's clouds, and its city lights (in the channel picked). */
interface WorldTex {
  surface: WebGLTexture;
  clouds: WebGLTexture;
  lights: WebGLTexture;
  lightsMask: [number, number, number, number];
  exposure: number;
}
interface Billboard {
  pos: V3;
  size: number;
  rot: number;
  variant: number;
  bright: number;
  /** It fades out between near + 1.05 and near sizes away (before it can fill the view). */
  near: number;
  colA: [number, number, number, number];
  colB: V3;
  gone?: number;
}
interface Belt {
  origin: V3;
  length: number;
  count: number;
  gone?: number;
}
interface Comet {
  pos: V3;
  vel: V3;
  born: number;
  life: number;
}

/** Nebula palettes: [main emission, secondary emission, dust opacity]. Physical, not brand. */
const NEBULA_PALETTES: [V3, V3, number][] = [
  [[0.95, 0.2, 0.28], [0.12, 0.62, 0.68], 0.75], // H-alpha red and O-III teal
  [[0.92, 0.32, 0.55], [0.35, 0.45, 1.0], 0.6], // pink emission, blue reflection
  [[1.0, 0.55, 0.25], [0.95, 0.3, 0.22], 0.85], // warm gas, heavy dust
];
const NO_ATMO: Atmo = [0, 0, 0, 0];

/**
 * How each world is shown. Sizes are for the screen, not to scale: each planet is passed at `pass`
 * radii (at about 4 it fills half the height of the screen, sharp at its texture's resolution), a
 * little above or below the flight path (`lift`, a fraction of `pass`). Moons sit at `at` (radii to
 * the right, up, and towards us from the planet), away from the flight path.
 */
interface BodySpec {
  radius: number;
  pass: number;
  lift: number;
  atmo: Atmo;
  /** Surface texture width (height is half). */
  width: number;
  ring?: { inner: number; outer: number; opacity: number; facing?: boolean };
  moons?: { body: number; size: number; at: V3; atmo?: Atmo }[];
}
const BODIES: Record<number, BodySpec> = {
  [BODY.mercury]: { radius: 16, pass: 4.4, lift: -0.11, atmo: NO_ATMO, width: 1536 },
  [BODY.venus]: { radius: 34, pass: 4.2, lift: 0.09, atmo: [0.95, 0.82, 0.55, 0.05], width: 1536 },
  [BODY.earth]: {
    radius: 36,
    pass: 3.9,
    lift: -0.14,
    atmo: [0.32, 0.58, 1.0, 0.035],
    width: 2048,
    moons: [{ body: BODY.moon, size: 0.27, at: [1.9, 3.2, -5.8] }],
  },
  [BODY.mars]: {
    radius: 24,
    pass: 4.2,
    lift: 0.11,
    atmo: [0.95, 0.62, 0.45, 0.012],
    width: 1536,
    moons: [{ body: BODY.moon, size: 0.08, at: [2.15, 2.4, -4.3] }],
  },
  [BODY.jupiter]: {
    radius: 110,
    pass: 3.7,
    lift: -0.16,
    atmo: [0.85, 0.72, 0.55, 0.006],
    width: 2048,
    moons: [
      { body: BODY.io, size: 0.07, at: [1.95, 2.45, -5.85] },
      { body: BODY.europa, size: 0.06, at: [3.1, -1.15, -11.7] },
    ],
  },
  [BODY.saturn]: {
    radius: 95,
    pass: 5.0,
    lift: 0.31,
    atmo: [0.85, 0.78, 0.6, 0.006],
    width: 1536,
    ring: { inner: 1.25, outer: 2.3, opacity: 0.9 },
    moons: [{ body: BODY.titan, size: 0.09, at: [3.35, 2.6, -9.25], atmo: [0.95, 0.62, 0.3, 0.08] }],
  },
  [BODY.uranus]: {
    radius: 60,
    pass: 4.4,
    lift: 0.11,
    atmo: [0.55, 0.85, 0.9, 0.025],
    width: 1024,
    ring: { inner: 1.55, outer: 2.05, opacity: 0.35, facing: true },
  },
  [BODY.neptune]: {
    radius: 58,
    pass: 4.3,
    lift: -0.11,
    atmo: [0.35, 0.55, 1.0, 0.03],
    width: 1536,
    moons: [{ body: BODY.triton, size: 0.12, at: [2.15, 3.1, -6.2] }],
  },
};
/**
 * Real maps (Solar System Scope, CC BY 4.0, from NASA data; credited on the page) in public/space/:
 * the surface (Earth's with its oceans in alpha), and Earth's clouds and city lights.
 */
const PLANET_MAPS: Partial<Record<number, { surface: string; clouds?: string; lights?: string }>> = {
  [BODY.mercury]: { surface: 'mercury.webp' },
  [BODY.venus]: { surface: 'venus.webp' },
  [BODY.earth]: { surface: 'earth.webp', clouds: 'earth-clouds.webp', lights: 'earth-lights.webp' },
  [BODY.moon]: { surface: 'moon.webp' },
  [BODY.mars]: { surface: 'mars.webp' },
  [BODY.jupiter]: { surface: 'jupiter.webp' },
  [BODY.saturn]: { surface: 'saturn.webp' },
  [BODY.uranus]: { surface: 'uranus.webp' },
  [BODY.neptune]: { surface: 'neptune.webp' },
};
const RING_MAP = 'saturn-rings.webp';
/** How each world reflects sunlight: [airless (Lommel–Seeliger) weight, limb darkening]. */
const PHOTOMETRY: Partial<Record<number, [number, number]>> = {
  [BODY.mercury]: [0.85, 0],
  [BODY.moon]: [0.85, 0],
  [BODY.io]: [0.7, 0],
  [BODY.europa]: [0.6, 0],
  [BODY.triton]: [0.6, 0],
  [BODY.mars]: [0.35, 0.1],
  [BODY.earth]: [0, 0.1],
  [BODY.venus]: [0, 0.3],
  [BODY.titan]: [0, 0.3],
  [BODY.jupiter]: [0, 0.35],
  [BODY.saturn]: [0, 0.35],
  [BODY.uranus]: [0, 0.3],
  [BODY.neptune]: [0, 0.3],
};
/**
 * Exposure of each real map, so its tones land where the tone curve keeps them (a map is already a
 * picture of the world; the generated surfaces are darker albedos and use GENERATED_EXPOSURE).
 */
const MAP_EXPOSURE: Partial<Record<number, number>> = {
  [BODY.mercury]: 0.62,
  [BODY.venus]: 0.6,
  [BODY.earth]: 0.95,
  [BODY.moon]: 0.62,
  [BODY.mars]: 0.8,
  [BODY.jupiter]: 0.66,
  [BODY.saturn]: 0.66,
  [BODY.uranus]: 0.62,
  [BODY.neptune]: 0.8,
};
const GENERATED_EXPOSURE = 2.1;
/** Texture sizes of the moons (they are never large on screen). */
const MOON_WIDTH: Record<number, number> = {
  [BODY.moon]: 1024,
  [BODY.io]: 512,
  [BODY.europa]: 512,
  [BODY.titan]: 512,
  [BODY.triton]: 512,
};

export function createSpaceEngine(o: SpaceEngineOptions): SpaceEngine | null {
  if (typeof WebGL2RenderingContext === 'undefined') return null;
  let gl: WebGL2RenderingContext | null;
  try {
    gl = o.canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'low-power',
    });
  } catch {
    gl = null;
  }
  if (!gl || gl.isContextLost()) return null;
  try {
    return start(gl, o);
  } catch (err) {
    console.warn('Sign-in background unavailable:', err);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return null;
  }
}

function start(gl: WebGL2RenderingContext, o: SpaceEngineOptions): SpaceEngine {
  const { canvas, reduced } = o;
  // ── GPU resources (all remembered, all freed in dispose) ──
  const shaders: WebGLShader[] = [];
  const programs: WebGLProgram[] = [];
  const buffers: WebGLBuffer[] = [];
  const vaos: WebGLVertexArrayObject[] = [];
  const textures: WebGLTexture[] = [];
  const fbos: WebGLFramebuffer[] = [];
  const keep = <T>(list: T[], v: T | null): T => {
    if (!v) throw new Error('WebGL allocation failed');
    list.push(v);
    return v;
  };
  /** Programs that read noise get the shared noise texture (unit 7). */
  const bindNoise = (p: WebGLProgram) => {
    const loc = gl.getUniformLocation(p, 'u_noise');
    if (!loc) return;
    gl.useProgram(p);
    gl.uniform1i(loc, 7);
  };
  const program = (vs: string, fs: string) => {
    const p = keep(programs, gl.createProgram());
    for (const [type, src] of [
      [gl.VERTEX_SHADER, vs],
      [gl.FRAGMENT_SHADER, fs],
    ] as const) {
      const s = keep(shaders, gl.createShader(type));
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
      gl.attachShader(p, s);
    }
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'link');
    bindNoise(p);
    const cache = new Map<string, WebGLUniformLocation | null>();
    const u = (n: string) => {
      if (!cache.has(n)) cache.set(n, gl.getUniformLocation(p, n));
      return cache.get(n) ?? null;
    };
    return { p, u };
  };
  /**
   * A program compiled in the background: nothing waits for it until ready() says it is done
   * (KHR_parallel_shader_compile; without it, the first ready() call waits).
   */
  const parallel = gl.getExtension('KHR_parallel_shader_compile');
  const programLater = (vs: string, fs: string) => {
    const p = keep(programs, gl.createProgram());
    for (const [type, src] of [
      [gl.VERTEX_SHADER, vs],
      [gl.FRAGMENT_SHADER, fs],
    ] as const) {
      const sh = keep(shaders, gl.createShader(type));
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      gl.attachShader(p, sh);
    }
    gl.linkProgram(p);
    let state: 'compiling' | 'ready' | 'failed' = 'compiling';
    const cache = new Map<string, WebGLUniformLocation | null>();
    return {
      p,
      u: (n: string) => {
        if (!cache.has(n)) cache.set(n, gl.getUniformLocation(p, n));
        return cache.get(n) ?? null;
      },
      ready: () => {
        if (
          state === 'compiling' &&
          (!parallel || gl.getProgramParameter(p, parallel.COMPLETION_STATUS_KHR))
        ) {
          state = gl.getProgramParameter(p, gl.LINK_STATUS) ? 'ready' : 'failed';
          if (state === 'ready') bindNoise(p);
        }
        return state;
      },
    };
  };
  const instanced = (data: Float32Array, layout: number[], usage: number) => {
    const vao = keep(vaos, gl.createVertexArray());
    const buf = keep(buffers, gl.createBuffer());
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, usage);
    const stride = layout.reduce((a, b) => a + b, 0) * 4;
    let off = 0;
    layout.forEach((size, i) => {
      gl.enableVertexAttribArray(i);
      gl.vertexAttribPointer(i, size, gl.FLOAT, false, stride, off);
      gl.vertexAttribDivisor(i, 1);
      off += size * 4;
    });
    gl.bindVertexArray(null);
    return { vao, buf };
  };
  const tex2d = (w: number, h: number, wrapS: number = gl.CLAMP_TO_EDGE) => {
    const t = keep(textures, gl.createTexture());
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  const fboFor = (...attachments: WebGLTexture[]) => {
    const f = keep(fbos, gl.createFramebuffer());
    gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    attachments.forEach((t, i) =>
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0),
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return f;
  };

  // The shared noise texture: unit 7, bound for the engine's whole life.
  const NOISE_UNIT = 7;
  const noiseTex = keep(textures, gl.createTexture());
  gl.activeTexture(gl.TEXTURE0 + NOISE_UNIT);
  gl.bindTexture(gl.TEXTURE_3D, noiseTex);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage3D(
    gl.TEXTURE_3D,
    0,
    gl.R16F,
    NOISE_SIZE,
    NOISE_SIZE,
    NOISE_SIZE,
    0,
    gl.RED,
    gl.HALF_FLOAT,
    bakeNoise(mulberry32(7)),
  );
  for (const wrap of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T, gl.TEXTURE_WRAP_R])
    gl.texParameteri(gl.TEXTURE_3D, wrap, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.activeTexture(gl.TEXTURE0);
  const P = {
    skyBake: program(S.BAKE_VS, S.SKY_BAKE_FS),
    nebulaBake: program(S.BAKE_VS, S.NEBULA_BAKE_FS),
    sky: program(S.FULLSCREEN_VS, S.SKY_FS),
    galaxy: program(S.GALAXY_VS, S.GALAXY_FS),
    skyStars: program(S.SKY_STARS_VS, S.SKY_STARS_FS),
    nearStars: program(S.NEAR_STARS_VS, S.NEAR_STARS_FS),
    sun: program(S.SUN_VS, S.SUN_FS),
    planet: program(S.FULLSCREEN_VS, S.PLANET_FS),
    nebula: program(S.NEBULA_VS, S.NEBULA_FS),
    rock: program(S.ROCK_VS, S.ROCK_FS),
    comet: program(S.COMET_VS, S.COMET_FS),
    down: program(S.BAKE_VS, S.BLOOM_DOWN_FS),
    blur: program(S.BAKE_VS, S.BLUR_FS),
    final: program(S.BAKE_VS, S.FINAL_FS),
  };
  const empty = keep(vaos, gl.createVertexArray());
  // The planet surface bakes: one small program per group of worlds, compiled in the background.
  const bakeGroups = {
    terran: programLater(S.BAKE_VS, S.PLANET_BAKE.terran),
    giant: programLater(S.BAKE_VS, S.PLANET_BAKE.giant),
    venus: programLater(S.BAKE_VS, S.PLANET_BAKE.venus),
    moons: programLater(S.BAKE_VS, S.PLANET_BAKE.moons),
    rocky: programLater(S.BAKE_VS, S.PLANET_BAKE.rocky),
  };
  const groupOf = (kind: number) =>
    kind === BODY.earth
      ? bakeGroups.terran
      : kind === BODY.jupiter || kind === BODY.saturn || kind === BODY.neptune || kind === BODY.uranus
        ? bakeGroups.giant
        : kind === BODY.venus
          ? bakeGroups.venus
          : kind === BODY.io || kind === BODY.europa || kind === BODY.titan
            ? bakeGroups.moons
            : bakeGroups.rocky;
  const half = !!gl.getExtension('EXT_color_buffer_float');
  const hdr = half
    ? ([gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT] as const)
    : ([gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE] as const);

  // ── The universe's layout (random per visit) ──
  const devSeed = import.meta.env.DEV ? Number(new URLSearchParams(location.search).get('spaceSeed')) : 0;
  const rand = mulberry32(devSeed || Math.floor(Math.random() * 1e9));
  const pole: V3 = norm([0.42, 0.9, 0.1]);
  const toward: V3 = norm([-0.55, 0.05, -1]);
  const centre: V3 = norm(sub(toward, mul(pole, dot(toward, pole))));

  // Far stars on the celestial sphere, crowding towards the Milky Way.
  const east = cross(pole, centre);
  const skyStars = new Float32Array(SKY_STARS * 5);
  for (let i = 0; i < SKY_STARS; i++) {
    const inPlane = rand() < 0.45;
    const l = rand() * Math.PI * 2;
    const b = inPlane ? (rand() + rand() + rand() - 1.5) * 0.18 : Math.asin(rand() * 2 - 1);
    const d = add(
      add(mul(centre, Math.cos(b) * Math.cos(l)), mul(east, Math.cos(b) * Math.sin(l))),
      mul(pole, Math.sin(b)),
    );
    skyStars.set([d[0], d[1], d[2], rand() ** 4.5, temperature(rand())], i * 5);
  }
  const skyStarsBuf = instanced(skyStars, [4, 1], gl.STATIC_DRAW);

  const nearStars = new Float32Array(NEAR_STARS * 5);
  for (let i = 0; i < NEAR_STARS; i++)
    nearStars.set([rand() * CUBE, rand() * CUBE, rand() * CUBE, rand() ** 3, temperature(rand())], i * 5);
  const nearStarsBuf = instanced(nearStars, [4, 1], gl.STATIC_DRAW);

  // Galaxies: a few large ones (spirals, a barred spiral, an edge-on, an elliptical) and many small.
  const heroes: V3[] = [];
  const galaxyData: number[] = [];
  const addGalaxy = (dir: V3, radius: number, type: number, incl: number, bright: number) => {
    galaxyData.push(dir[0], dir[1], dir[2], radius);
    galaxyData.push(rand() * Math.PI, incl, type, rand() < 0.75 ? 2 : 3);
    galaxyData.push(0.38 + rand() * 0.22, rand(), bright, rand());
  };
  const heroDirs: V3[] = [
    norm([0.22, 0.4, -1]),
    norm([0.6, -0.3, -1]),
    norm([-1, 0.35, 0.2]),
    norm([0.2, 0.5, 1]),
    norm([1, -0.1, 0.1]),
  ];
  const heroTypes = [0, 1, 0, 2, 0];
  const heroIncl = [0.65, 0.4, 1.47, 0.5, 1.0];
  const heroSize = [0.2, 0.09, 0.14, 0.07, 0.13];
  heroDirs.forEach((d, i) => {
    const dir = norm(add(d, [(rand() - 0.5) * 0.15, (rand() - 0.5) * 0.1, (rand() - 0.5) * 0.15]));
    heroes.push(dir);
    addGalaxy(dir, heroSize[i] ?? 0.05, heroTypes[i] ?? 0, heroIncl[i] ?? 0.6, 1.0);
  });
  for (let i = 0; i < 70; i++) {
    const z = rand() * 2 - 1;
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(1 - z * z);
    const t = rand();
    addGalaxy(
      [r * Math.cos(a), z, r * Math.sin(a)],
      0.004 + rand() ** 2 * 0.012,
      t < 0.25 ? 2 : t < 0.4 ? 1 : 0,
      rand() * 1.4,
      0.7,
    );
  }
  const galaxyBuf = instanced(new Float32Array(galaxyData), [4, 4, 4], gl.STATIC_DRAW);
  const galaxyCount = galaxyData.length / 12;

  // A star cluster to fly through (young, mostly blue-white stars, densest in the middle).
  const clusterData = new Float32Array(CLUSTER_STARS * 5);
  for (let i = 0; i < CLUSTER_STARS; i++) {
    const g = () => (rand() + rand() + rand() - 1.5) * 1.15;
    const k = 55 * (0.35 + rand() ** 2);
    clusterData.set(
      [g() * k, g() * k * 0.8, g() * k, 0.35 + 0.65 * rand() ** 2, 0.55 + 0.45 * rand()],
      i * 5,
    );
  }
  const clusterBuf = instanced(clusterData, [4, 1], gl.STATIC_DRAW);
  let cluster: { origin: V3; gone?: number } | null = null;

  const nebulaData = new Float32Array(MAX_NEBULAE * 15);
  const nebulaBuf = instanced(nebulaData, [4, 4, 4, 3], gl.DYNAMIC_DRAW);
  const rockData = new Float32Array(MAX_ROCKS * 8);
  const rockBuf = instanced(rockData, [4, 4], gl.DYNAMIC_DRAW);

  // ── Baked textures (one per frame while the screen is still black) ──
  const sky = keep(textures, gl.createTexture());
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, sky);
  for (let f = 0; f < 6; f++)
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + f, 0, hdr[0], SKY_SIZE, SKY_SIZE, 0, hdr[1], hdr[2], null);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const skyFbo = keep(fbos, gl.createFramebuffer());
  const nebulaTex = tex2d(NEBULA_SIZE, NEBULA_SIZE);
  const planetTex = new Map<number, WorldTex>();
  const bakes: (() => void)[] = [];
  /** One-pixel draws of everything the journey meets later (see draw). Each world joins once baked. */
  const warmUps: (() => void)[] = [
    () => {
      gl.useProgram(P.rock.p);
      gl.bindVertexArray(rockBuf.vao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, 1);
    },
    () => {
      gl.useProgram(P.nebula.p);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, nebulaTex);
      gl.uniform1i(P.nebula.u('u_tex'), 0);
      gl.bindVertexArray(nebulaBuf.vao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, 1);
    },
    () => {
      gl.useProgram(P.nearStars.p);
      gl.bindVertexArray(clusterBuf.vao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, 1);
    },
    () => {
      gl.useProgram(P.comet.p);
      gl.bindVertexArray(empty);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
  ];
  for (let f = 0; f < 6; f++)
    bakes.push(() => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, skyFbo);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_CUBE_MAP_POSITIVE_X + f,
        sky,
        0,
      );
      gl.viewport(0, 0, SKY_SIZE, SKY_SIZE);
      gl.useProgram(P.skyBake.p);
      gl.uniform1i(P.skyBake.u('u_face'), f);
      gl.uniform3fv(P.skyBake.u('u_pole'), pole);
      gl.uniform3fv(P.skyBake.u('u_centre'), centre);
      gl.bindVertexArray(empty);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });
  bakes.push(() => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fboFor(nebulaTex));
    gl.viewport(0, 0, NEBULA_SIZE, NEBULA_SIZE);
    gl.useProgram(P.nebulaBake.p);
    gl.bindVertexArray(empty);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindTexture(gl.TEXTURE_2D, nebulaTex);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  });
  // ── Planet surfaces ──
  // Real maps where there are some (PLANET_MAPS), loaded in the background in the order the worlds are
  // visited and handed to the GPU one per frame. A world whose map cannot be loaded, and the small
  // moons, are generated instead, a few rows per frame.
  const blankTex = tex2d(4, 2, gl.REPEAT);
  let ringMap: WebGLTexture | null = null;
  const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
  const anisoLevel = aniso
    ? Math.min(8, Number(gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)) || 1)
    : 1;
  const finishTexture = (t: WebGLTexture) => {
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    // Sharp towards the limb, where the surface is seen at a slant.
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, anisoLevel);
  };
  const bindWorld = (w: WorldTex) => {
    const units: [string, WebGLTexture][] = [
      ['u_surface', w.surface],
      ['u_clouds', w.clouds],
      ['u_lights', w.lights],
      ['u_ringMap', ringMap ?? blankTex],
    ];
    units.forEach(([name, t], i) => {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.uniform1i(P.planet.u(name), i);
    });
    gl.uniform4fv(P.planet.u('u_lightsMask'), w.lightsMask);
    gl.activeTexture(gl.TEXTURE0);
  };
  const worldReady = (kind: number, w: WorldTex) => {
    planetTex.set(kind, w);
    warmUps.push(() => {
      gl.useProgram(P.planet.p);
      bindWorld(w);
      gl.bindVertexArray(empty);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });
  };
  const tourOrder = [
    BODY.mercury,
    BODY.venus,
    BODY.earth,
    BODY.moon,
    BODY.mars,
    BODY.jupiter,
    BODY.io,
    BODY.europa,
    BODY.saturn,
    BODY.titan,
    BODY.uranus,
    BODY.neptune,
    BODY.triton,
  ];
  const bakeJob = (kind: number) => {
    const w = BODIES[kind]?.width ?? MOON_WIDTH[kind] ?? 512;
    const terran = kind === BODY.earth;
    const surface = tex2d(w, w / 2, gl.REPEAT);
    const extra = terran ? tex2d(w, w / 2, gl.REPEAT) : blankTex;
    return {
      kind,
      w,
      h: w / 2,
      terran,
      surface,
      extra,
      fbo: terran ? fboFor(surface, extra) : fboFor(surface),
      row: 0,
      seed: rand() * 10,
    };
  };
  const planetJobs = tourOrder.filter((kind) => !PLANET_MAPS[kind]).map(bakeJob);
  const bakePlanetRows = () => {
    const job = planetJobs[0];
    if (!job) return;
    const prog = groupOf(job.kind);
    const state = prog.ready();
    if (state === 'compiling') return;
    if (state === 'failed') {
      planetJobs.shift(); // that world is skipped, the rest of the journey goes on
      return;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, job.fbo);
    gl.drawBuffers(job.terran ? [gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1] : [gl.COLOR_ATTACHMENT0]);
    gl.viewport(0, 0, job.w, job.h);
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(0, job.row, job.w, BAKE_ROWS);
    gl.disable(gl.BLEND);
    gl.useProgram(prog.p);
    gl.uniform1i(prog.u('u_kind'), job.kind);
    gl.uniform1f(prog.u('u_seed'), job.seed);
    gl.bindVertexArray(empty);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.SCISSOR_TEST);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
    job.row += BAKE_ROWS;
    if (job.row < job.h) return;
    for (const t of job.terran ? [job.surface, job.extra] : [job.surface]) finishTexture(t);
    planetJobs.shift();
    // A generated Earth keeps its clouds in red and its city lights in green.
    worldReady(job.kind, {
      surface: job.surface,
      clouds: job.extra,
      lights: job.extra,
      lightsMask: [0, 1, 0, 0],
      exposure: GENERATED_EXPOSURE,
    });
  };
  // Loading the maps. Each upload hands one image to the GPU; they run one per frame.
  const uploads: (() => void)[] = [];
  const loads = new AbortController();
  let pendingMaps = 0;
  const fetchMap = async (file: string) => {
    const res = await fetch(`${import.meta.env.BASE_URL}space/${file}`, { signal: loads.signal });
    if (!res.ok) throw new Error(`${file}: ${res.status}`);
    // Row 0 of a texture is the south pole; colours exactly as stored (Earth's alpha is a mask).
    return createImageBitmap(await res.blob(), {
      imageOrientation: 'flipY',
      premultiplyAlpha: 'none',
      colorSpaceConversion: 'none',
    });
  };
  const upload = (bmp: ImageBitmap, grey: boolean, wrapS: number = gl.REPEAT) => {
    const t = keep(textures, gl.createTexture());
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, grey ? gl.R8 : gl.RGBA8, grey ? gl.RED : gl.RGBA, gl.UNSIGNED_BYTE, bmp);
    bmp.close();
    finishTexture(t);
    return t;
  };
  const loadMaps = async () => {
    fetchMap(RING_MAP)
      .then((bmp) => uploads.push(() => (ringMap = upload(bmp, false, gl.CLAMP_TO_EDGE))))
      .catch(() => undefined); // the rings are generated instead
    for (const kind of tourOrder) {
      const files = PLANET_MAPS[kind];
      if (!files) continue;
      pendingMaps++;
      try {
        const [surface, clouds, lights] = await Promise.all([
          fetchMap(files.surface),
          files.clouds ? fetchMap(files.clouds) : null,
          files.lights ? fetchMap(files.lights) : null,
        ]);
        const got: { surface?: WebGLTexture; clouds?: WebGLTexture } = {};
        uploads.push(() => (got.surface = upload(surface, false)));
        uploads.push(() => (got.clouds = clouds ? upload(clouds, true) : blankTex));
        uploads.push(() => {
          const lightsTex = lights ? upload(lights, true) : blankTex;
          if (got.surface && got.clouds)
            worldReady(kind, {
              surface: got.surface,
              clouds: got.clouds,
              lights: lightsTex,
              lightsMask: [1, 0, 0, 0],
              exposure: MAP_EXPOSURE[kind] ?? 0.7,
            });
          pendingMaps--;
        });
      } catch {
        if (loads.signal.aborted) return;
        pendingMaps--;
        planetJobs.push(bakeJob(kind)); // generated instead
      }
    }
  };
  void loadMaps();

  // ── Render targets (HDR scene, quarter-size bloom) ──
  let width = 2;
  let height = 2;
  let scale = 1;
  const targets: { tex: WebGLTexture[]; fbo: WebGLFramebuffer[] } = { tex: [], fbo: [] };
  let sceneTex: WebGLTexture | null = null;
  let sceneFbo: WebGLFramebuffer | null = null;
  let bloomA: WebGLTexture | null = null;
  let bloomB: WebGLTexture | null = null;
  let bloomFboA: WebGLFramebuffer | null = null;
  let bloomFboB: WebGLFramebuffer | null = null;
  let sized = false;
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR) * scale;
    width = Math.max(2, Math.round(canvas.clientWidth * dpr));
    height = Math.max(2, Math.round(canvas.clientHeight * dpr));
    canvas.width = width;
    canvas.height = height;
    targets.tex.splice(0).forEach((t) => gl.deleteTexture(t));
    targets.fbo.splice(0).forEach((f) => gl.deleteFramebuffer(f));
    const target = (w: number, h: number): [WebGLTexture, WebGLFramebuffer] => {
      const t = gl.createTexture();
      const f = gl.createFramebuffer();
      if (!t || !f) throw new Error('render target allocation failed');
      targets.tex.push(t);
      targets.fbo.push(f);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, hdr[0], w, h, 0, hdr[1], hdr[2], null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      return [t, f];
    };
    [sceneTex, sceneFbo] = target(width, height);
    [bloomA, bloomFboA] = target(Math.max(1, width >> 2), Math.max(1, height >> 2));
    [bloomB, bloomFboB] = target(Math.max(1, width >> 2), Math.max(1, height >> 2));
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    sized = true;
  };
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => (sized = false)) : null;
  observer?.observe(canvas);

  // ── The camera and the journey ──
  const cam = {
    pos: [0, 0, 0] as V3,
    yaw: 0,
    pitch: 0,
    yawTarget: 0,
    pitchTarget: 0,
    /** The camera turns like a damped spring, so it starts and stops turning smoothly. */
    yawVel: 0,
    pitchVel: 0,
    roll: 0,
    speed: 10,
    speedTarget: 10,
    fov: FOV,
  };
  const basisAt = (yaw: number, pitch: number, roll: number) => {
    const cp = Math.cos(pitch);
    const f: V3 = [Math.sin(yaw) * cp, Math.sin(pitch), -Math.cos(yaw) * cp];
    const r0 = norm(cross(f, [0, 1, 0]));
    const u0 = cross(r0, f);
    const r = add(mul(r0, Math.cos(roll)), mul(u0, Math.sin(roll)));
    const u = cross(r, f);
    return { f, r, u };
  };
  const basis = () => basisAt(cam.yaw, cam.pitch, cam.roll);
  const planets: Planet[] = [];
  const billboards: Billboard[] = [];
  let belt: Belt | null = null;
  let comet: Comet | null = null;
  let sun: V3 = norm([0.8, 0.35, 0.4]);
  let sunTarget: V3 = sun;
  const nextLeg = createJourney(rand);
  let leg: Leg = { kind: 'cruise', duration: 0, variant: 0 };
  let legT = 0;
  let legSpeed = 10;
  let simTime = 0;
  let nextComet = 60;
  /** The world being approached in this leg, how far away it passes, and how fast we slow down. */
  let host: Planet | null = null;
  let hostPass = 1;
  let approachK = 0;
  /**
   * When (legT) the world had gone by and we began turning onto the course the camera is looking
   * along (−1 until then): the camera stays still, and the course swings round to meet it.
   */
  let turnBackAt = -1;
  let settledView: V3 = [0, 0, -1];
  let courseFrom: V3 = [0, 0, -1];
  /** Where the star field is: it moves at most at STREAK_SPEED, whatever the real speed. */
  let starPos: V3 = [0, 0, 0];
  let streak = 10;
  /** Where we are flying (the camera can look elsewhere: it follows a planet as we sweep past). */
  let travel: V3 = basis().f;
  const travelBasis = () => {
    const f = travel;
    const r = norm(cross(f, [0, 1, 0]));
    return { f, r, u: cross(r, f) };
  };

  /** A point ahead along the direction of travel (x right, y up). */
  const ahead = (d: number, x: number, y: number): V3 => {
    const { f, r, u } = travelBasis();
    return add(add(add(cam.pos, mul(f, d)), mul(r, x)), mul(u, y));
  };
  const leaveBehind = () => {
    for (const o of [...planets, ...billboards]) o.gone ??= simTime;
    if (belt) belt.gone ??= simTime;
    if (cluster) cluster.gone ??= simTime;
  };

  /**
   * A world to approach: it starts `start` radii ahead (a dot) and passes `pass` radii to the left,
   * `lift` (a fraction of `pass`) above the flight path. The speed follows the distance, so it grows
   * smoothly, as a real approach looks, and is big at `bigAt` seconds.
   */
  const approach = (
    planet: Omit<Planet, 'pos' | 'born'>,
    start: number,
    pass: number,
    lift: number,
    bigAt: number,
  ) => {
    const R = planet.radius;
    const side = Math.sqrt(Math.max(0.01, 1 - lift * lift)) * pass * R;
    const p: Planet = { ...planet, pos: ahead(start * R, -side, lift * pass * R), born: simTime };
    planets.push(p);
    host = p;
    hostPass = pass;
    // The distance y left to NEAR_END passes ahead follows y' = −(k·y + DRIFT): it shrinks
    // exponentially, then we drift. k is chosen so that y is NEAR_BIG passes at bigAt.
    const y0 = start / pass - NEAR_END;
    const T = Math.max(1, bigAt);
    approachK = Math.log(y0 / NEAR_BIG) / T;
    for (let i = 0; i < 6; i++) {
      const c = DRIFT / approachK;
      approachK = Math.log((y0 + c) / (NEAR_BIG + c)) / T;
    }
    return p;
  };

  const startLeg = (l: Leg) => {
    leg = l;
    legT = 0;
    host = null;
    turnBackAt = -1;
    const drift = (rand() - 0.5) * 0.25;
    const steady = l.kind === 'planet' || l.kind === 'belt';
    // Near worlds the camera is set from the course, so the course starts where the camera looks.
    if (steady) travel = basis().f;
    const { f, r, u } = travelBasis();
    cam.pitchTarget = steady ? cam.pitch : (rand() - 0.5) * 0.08;
    if (steady) cam.yawTarget = cam.yaw;
    // Lit from behind and to the right: the lit side faces the middle of the screen.
    const fromBehind = mix3([f, -0.55], [r, 0.75], [u, 0.3]);
    switch (l.kind) {
      case 'planet': {
        const spec = BODIES[l.variant];
        if (!spec) break;
        const R = spec.radius;
        const facing = !!spec.ring?.facing;
        const axis = facing ? mix3([f, -0.85], [r, 0.35], [u, 0.3]) : mix3([u, 1], [r, 0.22], [f, 0.12]);
        const ringNormal = facing ? axis : mix3([u, 0.9], [f, 0.35], [r, 0.15]);
        const planet = approach(
          {
            radius: R,
            kind: l.variant,
            axis,
            period: 240 + rand() * 120,
            phase: rand() * 6.28,
            atmo: spec.atmo,
            ...(spec.ring ? { ring: { ...spec.ring, normal: ringNormal } } : {}),
          },
          // The page opens with the first world already near (a small disk), not a distant dot.
          l.opening ? OPENING_RADII : APPROACH_RADII,
          spec.pass,
          spec.lift,
          l.duration - BIG_BEFORE_END,
        );
        for (const m of spec.moons ?? [])
          planets.push({
            pos: add(planet.pos, mul(add(add(mul(r, m.at[0]), mul(u, m.at[1])), mul(f, m.at[2])), R)),
            radius: R * m.size,
            kind: m.body,
            axis: u,
            period: 500,
            phase: rand() * 6.28,
            atmo: m.atmo ?? NO_ATMO,
            born: simTime,
          });
        sunTarget = fromBehind;
        break;
      }
      case 'jump':
        legSpeed = 10;
        cam.yawTarget = cam.yaw + drift;
        leaveBehind();
        break;
      case 'nebula': {
        legSpeed = 15;
        cam.yawTarget = cam.yaw + drift * 0.4;
        const palette = NEBULA_PALETTES[l.variant % NEBULA_PALETTES.length] ?? NEBULA_PALETTES[0];
        if (!palette) break;
        const [a, b, dust] = palette;
        const span = legSpeed * l.duration;
        sunTarget = mix3([f, 0.8], [r, -0.42], [u, 0.33]); // a young star shining through the gas
        const push = (pos: V3, size: number, bright: number, near: number) =>
          billboards.push({
            pos,
            size,
            rot: rand() * 6.28,
            variant: Math.floor(rand() * 4),
            bright,
            near,
            colA: [a[0], a[1], a[2], dust * 0.55],
            colB: b,
          });
        // Kept inside the view cone: a distant cloud ahead first, then the gas we fly through.
        for (let i = 0; i < 3; i++) {
          const z = 1100 + i * 260;
          push(ahead(z, (rand() - 0.6) * 0.5 * z, (rand() - 0.5) * 0.35 * z), 700 + rand() * 500, 0.32, 0.45);
        }
        for (let i = 0; i < 20; i++) {
          const z = span * (0.25 + 0.85 * (i / 20)) + 40;
          const size = 50 + rand() * 90;
          let x = (rand() - 0.62) * 0.5 * z;
          let y = (rand() - 0.5) * 0.36 * z;
          // A corridor through the gas: no cloud passes closer than 1.6 of its sizes, so each one
          // drifts by at the side, still showing, instead of swelling over the view as we go through.
          const off = Math.hypot(x, y);
          if (off < 1.6 * size) {
            const k = (1.6 * size) / Math.max(off, 0.01);
            x *= k;
            y *= k;
          }
          push(ahead(z, x, y), size, 0.24, 1);
        }
        break;
      }
      case 'belt': {
        // The asteroid belt between Mars and Jupiter. It begins beyond where rocks become visible,
        // so every rock first appears small in the distance and grows as we slow down among them.
        legSpeed = 14;
        // It starts just beyond sight, after the slow-down from the previous leg's speed.
        const span = legSpeed * l.duration * 1.6;
        const origin = ahead(ROCK_FAR * 0.85 + Math.max(0, cam.speed - legSpeed) * 1.1, 0, 0);
        for (let i = 0; i < MAX_ROCKS; i++) {
          const along = rand() * span;
          const reach = 30 + 0.55 * (along + 60);
          let x = (rand() - 0.62) * reach;
          let y = (rand() - 0.5) * reach * 0.65;
          const size = i < 10 ? 1.6 + rand() * 2.2 : 0.12 + 1.1 * rand() ** 3;
          // Keep the flight path clear: nothing passes closer than a few rock widths.
          const clear = 7 + size * 4;
          const off = Math.hypot(x, y);
          if (off < clear) {
            const k = clear / Math.max(off, 0.01);
            x *= k;
            y *= k;
          }
          const p = add(add(mul(f, along), mul(r, x)), mul(u, y));
          rockData.set([p[0], p[1], p[2], size, rand() - 0.5, rand() - 0.5, rand() - 0.5, rand()], i * 8);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, rockBuf.buf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, rockData);
        belt = { origin, length: span * 1.2, count: MAX_ROCKS };
        sunTarget = fromBehind;
        break;
      }
      case 'vista': {
        legSpeed = 3.5;
        // One of the two spiral galaxies nearest to where we are looking, so the camera turns
        // calmly (at most 75°) to face it.
        const turnTo = (g: V3) => angleDiff(Math.atan2(g[0], -g[2]), cam.yaw);
        const near = [0, 1, 2, 4]
          .map((i) => heroes[i] ?? f)
          .sort((a, b) => Math.abs(turnTo(a)) - Math.abs(turnTo(b)));
        const g = near[l.variant % 2] ?? f;
        cam.yawTarget = cam.yaw + Math.max(-1.3, Math.min(1.3, turnTo(g)));
        cam.pitchTarget = Math.max(-0.35, Math.min(0.35, Math.asin(g[1])));
        break;
      }
      default:
        // Cruising through a star cluster.
        legSpeed = 7;
        cam.yawTarget = cam.yaw + drift * 0.3;
        cluster = { origin: ahead(legSpeed * l.duration + 40, -28, 6) };
    }
  };

  const update = (dt: number) => {
    simTime += dt;
    legT += dt;
    if (legT >= leg.duration) startLeg(nextLeg());
    const steady = leg.kind === 'planet' || leg.kind === 'belt';
    // Out among the stars we fly where we look; near worlds we hold course while the camera turns.
    if (!steady)
      travel = norm(add(mul(travel, 1 - Math.min(1, dt / 1.5)), mul(basis().f, Math.min(1, dt / 1.5))));
    const f = travel;
    // Speed. Approaching a world, the speed follows the distance (fast while it is a dot, slow as it
    // fills the view), then we leave at speed. A jump goes to light speed and back.
    let tau = 1.6;
    if (host && !host.gone) {
      const z = dot(sub(host.pos, cam.pos), f);
      if (legT < leg.duration - SPEED_OFF) {
        const near = hostPass * host.radius;
        // (A softened max(0, …), so the speed eases into the drift instead of kinking.)
        const y = z - NEAR_END * near;
        const e = 0.25 * near;
        cam.speedTarget = approachK * 0.5 * (y + Math.sqrt(y * y + e * e)) + DRIFT * near;
        // Followed closely, so the world arrives on time. (The jump in speed as a leg starts is far
        // above STREAK_SPEED, so the star field does not show it.)
        tau = 0.05;
      } else {
        cam.speedTarget = 900;
        tau = 0.7;
      }
    } else if (leg.kind === 'jump') {
      const k = smooth(0.3, 1.6, legT) * (1 - smooth(leg.duration - 2.2, leg.duration - 0.2, legT));
      cam.speedTarget = lerp(legSpeed, STREAK_SPEED, k);
      tau = 0.35;
    } else if (leg.kind === 'belt') {
      const leaving = legT > leg.duration - 2;
      cam.speedTarget = leaving ? 900 : legSpeed;
      tau = leaving ? 0.7 : 1.1;
    } else cam.speedTarget = legSpeed;
    cam.speed = simTime <= dt ? cam.speedTarget : lerp(cam.speed, cam.speedTarget, 1 - Math.exp(-dt / tau));
    // The star field shows the speed (up to light speed), and the view widens at speed.
    streak = Math.min(cam.speed, STREAK_SPEED);
    const warp = smooth(120, STREAK_SPEED, streak);
    const fovTarget = (leg.kind === 'vista' ? FOV - 10 : FOV) + 9 * warp;
    // (From the very first frame the view is as wide as the speed makes it, so nothing creeps.)
    cam.fov =
      simTime <= dt
        ? fovTarget
        : lerp(cam.fov, fovTarget, 1 - Math.exp(-dt / (leg.kind === 'vista' ? 5 : 0.5)));
    cam.pos = add(cam.pos, mul(f, cam.speed * dt));
    starPos = add(starPos, mul(f, streak * dt));
    if (steady) {
      // Passing a world, the camera turns with it by exactly trackTurn(θ), θ being the world's angle
      // from the way we are going. Its place on screen is then θ − trackTurn(θ), which only ever
      // grows: it drifts out from the middle, holds still while the camera turns with it, then glides
      // off the left — it never swings back and forth. Once it has gone by, the camera stays still
      // and the course swings round onto the way it is looking (no sweeping pan of the stars).
      let aim = travel;
      if (host && !host.gone) {
        const rel = sub(host.pos, cam.pos);
        const theta = Math.acos(Math.max(-1, Math.min(1, dot(rel, travel) / (len(rel) || 1))));
        if (turnBackAt < 0 && (theta > PASSED || legT > leg.duration - SPEED_OFF - TURN_BACK)) {
          turnBackAt = legT;
          settledView = basis().f;
          courseFrom = travel;
        }
        if (turnBackAt >= 0) {
          aim = settledView;
          const s = smooth(turnBackAt, turnBackAt + TURN_BACK, legT);
          travel = norm(add(mul(courseFrom, 1 - s), mul(settledView, s)));
        } else {
          const turn = trackTurn(theta);
          const across = sub(rel, mul(travel, dot(rel, travel)));
          if (len(across) > 1e-9) aim = add(mul(travel, Math.cos(turn)), mul(norm(across), Math.sin(turn)));
        }
      }
      const yaw = cam.yaw + angleDiff(Math.atan2(aim[0], -aim[2]), cam.yaw);
      const pitch = Math.asin(Math.max(-0.95, Math.min(0.95, aim[1])));
      // Kept for a smooth hand-over to the eased heading of the next leg.
      cam.yawVel = dt > 0 ? (yaw - cam.yaw) / dt : 0;
      cam.pitchVel = dt > 0 ? (pitch - cam.pitch) / dt : 0;
      cam.yaw = cam.yawTarget = yaw;
      cam.pitch = cam.pitchTarget = pitch;
    } else {
      // Out among the stars: a slow, continuous drift, eased towards each leg's target by a critically
      // damped spring (it settles in about `look` seconds, without overshooting).
      cam.yawTarget += Math.sin(simTime * 0.05) * 0.004 * dt;
      const look = leg.kind === 'vista' ? 2.6 : 6;
      const spring = 2.15 / look;
      cam.yawVel += (spring * spring * (cam.yawTarget - cam.yaw) - 2 * spring * cam.yawVel) * dt;
      cam.yaw += cam.yawVel * dt;
      const pitchSpring = 2.15 / 6;
      cam.pitchVel +=
        (pitchSpring * pitchSpring * (cam.pitchTarget - cam.pitch) - 2 * pitchSpring * cam.pitchVel) * dt;
      cam.pitch += cam.pitchVel * dt;
    }
    cam.roll = 0.04 * Math.sin(simTime * 0.031) + 0.015 * Math.sin(simTime * 0.077);
    sun = norm(add(mul(sun, 1 - Math.min(1, dt / 4)), mul(sunTarget, Math.min(1, dt / 4))));

    // A comet now and then, out among the stars.
    if (
      simTime > nextComet &&
      !comet &&
      (leg.kind === 'nebula' || leg.kind === 'cruise' || leg.kind === 'vista')
    ) {
      const { r, u } = basis();
      comet = {
        pos: ahead(400, -120 + rand() * 35, 70 + rand() * 40),
        vel: add(mul(r, 3 + rand() * 2), mul(u, -1)),
        born: simTime,
        life: 26,
      };
      nextComet = simTime + 40 + rand() * 40;
    }
    if (comet) {
      comet.pos = add(comet.pos, mul(comet.vel, dt));
      if (simTime - comet.born > comet.life) comet = null;
    }
    // Forget what is far behind.
    const faded = (o: { gone?: number }) => o.gone !== undefined && simTime - o.gone > FADE_OUT;
    for (let i = planets.length - 1; i >= 0; i--) {
      const p = planets[i];
      if (!p) continue;
      // Gone once it is well behind us (more than twice as far behind as it is to the side).
      const rel = sub(p.pos, cam.pos);
      const behind = -dot(rel, f);
      const aside = len(add(rel, mul(f, behind)));
      if (faded(p) || behind > Math.max(p.radius * 4, aside * 2)) planets.splice(i, 1);
    }
    for (let i = billboards.length - 1; i >= 0; i--) {
      const b = billboards[i];
      if (b && (faded(b) || dot(sub(b.pos, cam.pos), f) < -b.size)) billboards.splice(i, 1);
    }
    if (belt && (faded(belt) || dot(sub(belt.origin, cam.pos), f) < -belt.length)) belt = null;
    if (cluster && (faded(cluster) || dot(sub(cluster.origin, cam.pos), f) < -400)) cluster = null;
  };

  // A first leg straight away, and (in development only) a jump to any moment: /?spaceT=40
  startLeg(nextLeg());
  const skipTo = import.meta.env.DEV ? Number(new URLSearchParams(location.search).get('spaceT')) || 0 : 0;
  for (let t = 0; t < skipTo; t += 1 / 30) update(1 / 30);
  if (reduced) for (let t = 0; t < 58.5; t += 1 / 30) update(1 / 30); // a still picture beside the Earth

  // ── Drawing ──
  const t0 = performance.now();
  let last = t0;
  let raf = 0;
  let disposed = false;
  let readyAt = 0;
  const samples: number[] = [];
  let tuned = 0;
  let stillDrawn = false;

  const draw = (now: number) => {
    if (!sized) resize();
    const time = (now - t0) / 1000;
    const bright = readyAt ? smooth(0, 2.2, (now - readyAt) / 1000) : 0;
    const { f, r, u } = basis();
    const focus = o.focus?.getBoundingClientRect();
    const fx =
      focus && focus.width > 0
        ? clamp01((focus.left + focus.width / 2) / Math.max(1, canvas.clientWidth))
        : 0.5;
    const proj = perspective((cam.fov * Math.PI) / 180, width / height, fx * 2 - 1, 0.05, 20000);
    const view = viewRotation(r, u, f);
    const viewProj = multiply(proj, view);
    // The camera's axes scaled for the projection, for shaders that trace a ray through each pixel.
    const shiftX = fx * 2 - 1;
    const rayX = mul(r, 1 / (proj[0] ?? 1));
    const rayY = mul(u, 1 / (proj[5] ?? 1));
    const ray0 = sub(f, mul(rayX, shiftX));
    const setRays = (prog: { u: (name: string) => WebGLUniformLocation | null }) => {
      gl.uniform3fv(prog.u('u_ray0'), ray0);
      gl.uniform3fv(prog.u('u_rayX'), rayX);
      gl.uniform3fv(prog.u('u_rayY'), rayY);
    };
    // Where the camera will be looking a shutter-time from now: the stars streak as it turns, so a
    // turning view glides instead of stepping a few pixels each frame.
    const shutter = reduced ? 0 : SHUTTER; // a still picture shows no motion
    const next = basisAt(cam.yaw + cam.yawVel * shutter, cam.pitch + cam.pitchVel * shutter, cam.roll);
    const viewNext = viewRotation(next.r, next.u, next.f);
    const vis = (o: { gone?: number }) =>
      o.gone === undefined ? 1 : 1 - smooth(0, FADE_OUT, simTime - o.gone);

    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFbo);
    gl.viewport(0, 0, width, height);
    // The first time something is drawn, the browser can stall for a frame while it prepares it, so
    // each kind of object and each world's surface is drawn once, into one pixel (the sky then covers
    // it), as soon as it is ready — during the opening, not as a world arrives.
    const warm = warmUps.shift();
    if (warm) {
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(0, 0, 1, 1);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      warm();
      gl.disable(gl.SCISSOR_TEST);
    }
    gl.disable(gl.BLEND);
    gl.bindVertexArray(empty);
    // The sky.
    gl.useProgram(P.sky.p);
    setRays(P.sky);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, sky);
    gl.uniform1i(P.sky.u('u_sky'), 0);
    gl.uniform1f(P.sky.u('u_bright'), bright);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    // Galaxies and far stars.
    gl.useProgram(P.galaxy.p);
    gl.uniformMatrix4fv(P.galaxy.u('u_viewProj'), false, viewProj);
    gl.uniform1f(P.galaxy.u('u_time'), time);
    gl.uniform1f(P.galaxy.u('u_bright'), bright);
    gl.bindVertexArray(galaxyBuf.vao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, galaxyCount);
    gl.useProgram(P.skyStars.p);
    gl.uniformMatrix4fv(P.skyStars.u('u_viewProj'), false, viewProj);
    gl.uniformMatrix4fv(P.skyStars.u('u_viewProjNext'), false, multiply(proj, viewNext));
    gl.uniform2f(P.skyStars.u('u_res'), width, height);
    gl.uniform1f(P.skyStars.u('u_bright'), bright);
    gl.bindVertexArray(skyStarsBuf.vao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, SKY_STARS);
    // The nearest star, when it is in view.
    if (dot(sun, f) > 0.05) {
      gl.useProgram(P.sun.p);
      gl.uniformMatrix4fv(P.sun.u('u_viewProj'), false, viewProj);
      gl.uniform3fv(P.sun.u('u_dir'), sun);
      gl.uniform2f(P.sun.u('u_res'), width, height);
      gl.uniform1f(P.sun.u('u_size'), height * 0.45);
      gl.uniform1f(P.sun.u('u_power'), bright * 0.9);
      gl.uniform3f(P.sun.u('u_colour'), 1, 0.94, 0.86);
      gl.bindVertexArray(empty);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // Nebulae, back to front.
    if (billboards.length) {
      const list = billboards
        .map((b) => {
          const rel = sub(b.pos, cam.pos);
          const d = len(rel);
          // Faded out before it can fill the screen, so the gas drifts past instead of fogging it.
          const fade = smooth(b.size * b.near, b.size * (b.near + 1.05), d) * smooth(4500, 2500, d) * vis(b);
          return { b, rel, d, fade };
        })
        .filter((x) => x.fade > 0.002 && dot(x.rel, f) > -x.b.size)
        .sort((a, b) => b.d - a.d)
        .slice(-MAX_NEBULAE);
      list.forEach(({ b, rel, fade }, i) => {
        nebulaData.set([...rel, b.size, b.rot, b.variant, b.bright, fade, ...b.colA, ...b.colB], i * 15);
      });
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(P.nebula.p);
      gl.uniformMatrix4fv(P.nebula.u('u_view'), false, view);
      gl.uniformMatrix4fv(P.nebula.u('u_proj'), false, proj);
      gl.uniform1f(P.nebula.u('u_bright'), bright);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, nebulaTex);
      gl.uniform1i(P.nebula.u('u_tex'), 0);
      gl.bindVertexArray(nebulaBuf.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, nebulaBuf.buf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, nebulaData, 0, list.length * 15);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, list.length);
    }

    // Nearby stars, with motion blur.
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(P.nearStars.p);
    gl.uniformMatrix4fv(P.nearStars.u('u_view'), false, view);
    gl.uniformMatrix4fv(P.nearStars.u('u_proj'), false, proj);
    const wrap = (v: number) => ((v % CUBE) + CUBE) % CUBE;
    gl.uniform3f(P.nearStars.u('u_camMod'), wrap(starPos[0]), wrap(starPos[1]), wrap(starPos[2]));
    gl.uniformMatrix4fv(P.nearStars.u('u_viewNext'), false, viewNext);
    gl.uniform3fv(P.nearStars.u('u_move'), mul(travel, streak * shutter));
    gl.uniform1f(P.nearStars.u('u_cube'), CUBE);
    gl.uniform2f(P.nearStars.u('u_res'), width, height);
    gl.uniform1f(P.nearStars.u('u_bright'), bright);
    gl.uniform1f(P.nearStars.u('u_wrap'), 1);
    gl.bindVertexArray(nearStarsBuf.vao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, Math.floor(NEAR_STARS * (tuned === 1 ? 0.6 : 1)));
    if (cluster) {
      gl.uniform1f(P.nearStars.u('u_wrap'), 0);
      gl.uniform3fv(P.nearStars.u('u_origin'), sub(cluster.origin, cam.pos));
      gl.uniform1f(P.nearStars.u('u_bright'), bright * vis(cluster));
      gl.bindVertexArray(clusterBuf.vao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, CLUSTER_STARS);
    }

    // Planets, far to near.
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(P.planet.p);
    setRays(P.planet);
    gl.uniform3fv(P.planet.u('u_sun'), sun);
    gl.uniform1f(P.planet.u('u_bright'), bright);
    gl.uniform1f(P.planet.u('u_pixel'), (2 * Math.tan((cam.fov * Math.PI) / 360)) / height);
    gl.bindVertexArray(empty);
    [...planets]
      .sort((a, b) => len(sub(b.pos, cam.pos)) - len(sub(a.pos, cam.pos)))
      .forEach((p) => {
        const tex = planetTex.get(p.kind);
        const rel = sub(p.pos, cam.pos);
        if (!tex || (dot(norm(rel), f) < -0.2 && len(rel) > p.radius * 3)) return;
        // It fades in once its surface is ready (a map still loading, say), never popping in. (The
        // still picture has no time passing: it is simply there.)
        p.texAt ??= reduced ? -Infinity : simTime;
        bindWorld(tex);
        gl.uniform3fv(P.planet.u('u_centre'), rel);
        // Only the part of the screen the planet (and its rings and glow) can cover is shaded.
        const ext = p.radius * (p.ring ? p.ring.outer * 1.05 : 1.15 + p.atmo[3] * 4);
        // Its exact extent across and up the screen: the tangents from the eye to that sphere.
        const depth = dot(rel, f);
        const span = (side: number) => {
          const d = Math.hypot(side, depth);
          if (d <= ext * 1.02) return null;
          const at = Math.atan2(side, depth);
          const half = Math.asin(ext / d);
          if (at - half <= -1.5 || at + half >= 1.5) return null;
          return [Math.tan(at - half), Math.tan(at + half)] as const;
        };
        const sx = span(dot(rel, r));
        const sy = span(dot(rel, u));
        if (sx && sy) {
          const px = (t: number) => (t * (proj[0] ?? 1) + (fx * 2 - 1) + 1) * 0.5 * width;
          const py = (t: number) => (t * (proj[5] ?? 1) + 1) * 0.5 * height;
          const x0 = Math.max(0, Math.floor(px(sx[0])) - 2);
          const x1 = Math.min(width, Math.ceil(px(sx[1])) + 2);
          const y0 = Math.max(0, Math.floor(py(sy[0])) - 2);
          const y1 = Math.min(height, Math.ceil(py(sy[1])) + 2);
          if (x1 <= x0 || y1 <= y0) return;
          gl.enable(gl.SCISSOR_TEST);
          gl.scissor(x0, y0, x1 - x0, y1 - y0);
        } else if (depth + ext < 0)
          return; // wholly behind us
        else gl.disable(gl.SCISSOR_TEST);
        gl.uniform1f(P.planet.u('u_radius'), p.radius);
        const shown = vis(p) * smooth(0, 1.5, simTime - p.texAt);
        gl.uniform1f(P.planet.u('u_bright'), bright * shown);
        gl.uniform1f(P.planet.u('u_vis'), shown);
        // Turning eastward, as the planets do.
        gl.uniformMatrix3fv(
          P.planet.u('u_spin'),
          false,
          frame(p.axis, p.phase - (time / p.period) * Math.PI * 2),
        );
        const [ls, limb] = PHOTOMETRY[p.kind] ?? [0, 0];
        gl.uniform3f(P.planet.u('u_photometry'), ls, limb, tex.exposure);
        gl.uniform1f(P.planet.u('u_ringMapOn'), p.kind === BODY.saturn && ringMap ? 1 : 0);
        gl.uniform1f(P.planet.u('u_cloudSpin'), (time / p.period) * 0.35);
        gl.uniform4fv(P.planet.u('u_atmo'), p.atmo);
        gl.uniform1f(P.planet.u('u_terran'), p.kind === BODY.earth ? 1 : 0);
        gl.uniform4f(
          P.planet.u('u_ring'),
          p.ring?.inner ?? 0,
          p.ring?.outer ?? 0,
          p.ring?.opacity ?? 0,
          p.ring?.facing ? 1 : 0,
        );
        gl.uniform3fv(P.planet.u('u_ringNormal'), p.ring?.normal ?? [0, 1, 0]);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.disable(gl.SCISSOR_TEST);
      });

    // Asteroids.
    if (belt) {
      gl.useProgram(P.rock.p);
      gl.uniformMatrix4fv(P.rock.u('u_view'), false, view);
      gl.uniformMatrix4fv(P.rock.u('u_proj'), false, proj);
      gl.uniform3fv(P.rock.u('u_origin'), sub(belt.origin, cam.pos));
      gl.uniform1f(P.rock.u('u_time'), time);
      gl.uniform1f(P.rock.u('u_far'), ROCK_FAR);
      gl.uniform3f(P.rock.u('u_sunView'), dot(sun, r), dot(sun, u), -dot(sun, f));
      gl.uniform1f(P.rock.u('u_bright'), bright * vis(belt));
      gl.uniform1f(P.rock.u('u_vis'), vis(belt));
      gl.bindVertexArray(rockBuf.vao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, belt.count);
    }

    // A comet.
    if (comet) {
      const age = simTime - comet.born;
      // It fades away before we come close, so it is only ever seen from afar.
      const life =
        smooth(0, 3, age) *
        (1 - smooth(comet.life - 4, comet.life, age)) *
        smooth(140, 230, len(sub(comet.pos, cam.pos)));
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(P.comet.p);
      gl.uniformMatrix4fv(P.comet.u('u_view'), false, view);
      gl.uniformMatrix4fv(P.comet.u('u_proj'), false, proj);
      gl.uniform3fv(P.comet.u('u_head'), sub(comet.pos, cam.pos));
      // The tail streams away from the star, drawn across the line of sight (never end-on, where the
      // ribbon would twist).
      const sight = norm(sub(comet.pos, cam.pos));
      const away = mul(sun, -1);
      gl.uniform3fv(P.comet.u('u_tail'), mul(norm(sub(away, mul(sight, dot(away, sight) * 0.85))), 70));
      gl.uniform3fv(P.comet.u('u_bend'), mul(norm(comet.vel), -22));
      gl.uniform1f(P.comet.u('u_width'), 1.6);
      gl.uniform1f(P.comet.u('u_bright'), bright * life);
      gl.uniform1f(P.comet.u('u_time'), time);
      gl.bindVertexArray(empty);
      for (const which of [1, 0, 2]) {
        gl.uniform1i(P.comet.u('u_which'), which);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    }

    // Bloom: the bright parts at a quarter of the size, blurred twice.
    gl.disable(gl.BLEND);
    gl.bindVertexArray(empty);
    const bw = Math.max(1, width >> 2);
    const bh = Math.max(1, height >> 2);
    gl.viewport(0, 0, bw, bh);
    gl.bindFramebuffer(gl.FRAMEBUFFER, bloomFboA);
    gl.useProgram(P.down.p);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sceneTex);
    gl.uniform1i(P.down.u('u_src'), 0);
    gl.uniform2f(P.down.u('u_texel'), 1 / width, 1 / height);
    gl.uniform1f(P.down.u('u_threshold'), 0.85);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.useProgram(P.blur.p);
    gl.uniform1i(P.blur.u('u_src'), 0);
    for (let i = 0; i < 2; i++) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, bloomFboB);
      gl.bindTexture(gl.TEXTURE_2D, bloomA);
      gl.uniform2f(P.blur.u('u_dir'), (1 + i) / bw, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, bloomFboA);
      gl.bindTexture(gl.TEXTURE_2D, bloomB);
      gl.uniform2f(P.blur.u('u_dir'), 0, (1 + i) / bh);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    // Tone mapping to the screen.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    gl.useProgram(P.final.p);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sceneTex);
    gl.uniform1i(P.final.u('u_scene'), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, bloomA);
    gl.uniform1i(P.final.u('u_bloom'), 1);
    gl.uniform1f(P.final.u('u_exposure'), 1.15);
    gl.uniform1f(P.final.u('u_fade'), 1);
    gl.uniform2f(P.final.u('u_res'), width, height);
    gl.uniform1f(P.final.u('u_time'), time);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  };

  const frameLoop = (now: number) => {
    raf = requestAnimationFrame(frameLoop);
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    const bake = bakes.shift();
    if (bake) {
      bake();
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return;
    }
    if (!readyAt) readyAt = now;
    uploads.shift()?.();
    bakePlanetRows();
    if (reduced && planetJobs.length) bakePlanetRows();
    if (reduced) {
      // A still picture: drawn while it fades in, then only again after a resize.
      if (stillDrawn && sized) return;
      draw(now);
      stillDrawn = now - readyAt > 2400 && !planetJobs.length && !uploads.length && !pendingMaps;
      return;
    }
    // If the first frames are slow, render at a lower resolution with fewer stars.
    if (tuned < 2 && now - readyAt > 1500) {
      samples.push(dt * 1000);
      if (samples.length === 60) {
        const p90 = [...samples].sort((a, b) => a - b)[54] ?? 0;
        samples.length = 0;
        if (p90 > 22) {
          scale = tuned === 0 ? 0.75 : 0.6;
          tuned++;
          sized = false;
        } else tuned = 2;
      }
    }
    update(dt);
    draw(now);
  };
  const run = () => {
    if (disposed || raf || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(frameLoop);
  };
  const pause = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };
  const onVisibility = () => (document.hidden ? pause() : run());
  const onResize = () => {
    sized = false;
    stillDrawn = false;
  };
  const onLost = (e: Event) => {
    e.preventDefault();
    pause();
  };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('resize', onResize);
  canvas.addEventListener('webglcontextlost', onLost);
  run();

  return {
    dispose() {
      disposed = true;
      loads.abort();
      pause();
      observer?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('webglcontextlost', onLost);
      if (!gl.isContextLost()) {
        [...targets.tex, ...textures].forEach((t) => gl.deleteTexture(t));
        [...targets.fbo, ...fbos].forEach((f) => gl.deleteFramebuffer(f));
        buffers.forEach((b) => gl.deleteBuffer(b));
        vaos.forEach((v) => gl.deleteVertexArray(v));
        programs.forEach((p) => gl.deleteProgram(p));
        shaders.forEach((s) => gl.deleteShader(s));
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}

/** Star temperatures: most look white to yellow-white, some orange, a few blue. */
function temperature(r: number) {
  if (r < 0.15) return (r / 0.15) * 0.3;
  if (r < 0.82) return 0.3 + ((r - 0.15) / 0.67) * 0.35;
  return 0.65 + ((r - 0.82) / 0.18) * 0.35;
}
/** The signed difference a − b, wrapped to (−π, π]. */
function angleDiff(a: number, b: number) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
