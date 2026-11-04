import { NOISE_PERIOD } from './noise';

/**
 * GLSL for the space journey. Everything is camera-relative (the camera sits at the origin), in
 * world units, with HDR colour (tone-mapped at the end). Colours are physical rather than brand:
 * blackbody star colours, H-alpha red and O-III teal for nebulae, planet albedos.
 */
export const HEADER = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp sampler3D;
`;

export const NOISE = `
vec3 hash33(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx) * 2.0 - 1.0;
}
float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
// Gradient noise, about -1…1: one fetch from the precomputed tileable texture (see noise.ts).
uniform sampler3D u_noise;
float gnoise(vec3 p) { return texture(u_noise, p * ${1 / NOISE_PERIOD}).r; }
float fbm3(vec3 p, int octaves) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 9; i++) {
    if (i >= octaves) break;
    s += a * gnoise(p);
    p = p * 2.03 + vec3(1.7, 9.2, 3.1);
    a *= 0.5;
  }
  return s;
}
float vnoise(vec2 p) { return 0.5 + 0.5 * texture(u_noise, vec3(p, 7.37) * ${1 / NOISE_PERIOD}).r; }
float fbm2(vec2 p, int octaves) {
  float a = 0.5, s = 0.0;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 9; i++) {
    if (i >= octaves) break;
    s += a * vnoise(p);
    p = m * p + 3.7;
    a *= 0.5;
  }
  return s;
}
`;

export const STAR_COLOUR = `
// Blackbody colours, M (cool) → O (hot).
vec3 starColour(float t) {
  vec3 c[7] = vec3[7](
    vec3(1.00, 0.72, 0.42), vec3(1.00, 0.82, 0.62), vec3(1.00, 0.92, 0.84), vec3(1.00, 0.98, 0.97),
    vec3(0.88, 0.91, 1.00), vec3(0.76, 0.83, 1.00), vec3(0.64, 0.73, 1.00));
  float x = clamp(t, 0.0, 1.0) * 6.0;
  int i = int(min(floor(x), 5.0));
  return mix(c[i], c[i + 1], x - float(i));
}
`;

export const FULLSCREEN_VS = `${HEADER}
// The world direction through each pixel, straight from the camera's axes: u_ray0 at the middle of
// the view, plus u_rayX and u_rayY per unit of screen position. (Inverting the projection instead
// loses so much precision in single floats that the sky and the worlds jiggle as the camera turns.)
uniform vec3 u_ray0;
uniform vec3 u_rayX;
uniform vec3 u_rayY;
out vec2 v_uv;
out vec3 v_ray;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  v_uv = p;
  vec2 ndc = p * 2.0 - 1.0;
  v_ray = u_ray0 + ndc.x * u_rayX + ndc.y * u_rayY;
  gl_Position = vec4(ndc, 0.0, 1.0);
}
`;

/** For baking textures: a fullscreen triangle with uv only. */
export const BAKE_VS = `${HEADER}
out vec2 v_uv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  v_uv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

// ── Baked once: the sky cube map (the Milky Way, its dust and glowing gas) ───────────────────────
export const SKY_BAKE_FS = `${HEADER}
${NOISE}
in vec2 v_uv;
out vec4 o;
uniform int u_face;
uniform vec3 u_pole;      // galactic north pole
uniform vec3 u_centre;    // direction of the galactic centre
vec3 faceDir(int f, vec2 uv) {
  float u = uv.x * 2.0 - 1.0, v = uv.y * 2.0 - 1.0;
  if (f == 0) return vec3(1.0, -v, -u);
  if (f == 1) return vec3(-1.0, -v, u);
  if (f == 2) return vec3(u, 1.0, v);
  if (f == 3) return vec3(u, -1.0, -v);
  if (f == 4) return vec3(u, -v, 1.0);
  return vec3(-u, -v, -1.0);
}
void main() {
  vec3 d = normalize(faceDir(u_face, v_uv));
  vec3 east = cross(u_pole, u_centre);
  float b = asin(clamp(dot(d, u_pole), -1.0, 1.0));
  float l = atan(dot(d, east), dot(d, u_centre));
  float bend = 0.05 * fbm3(d * 2.0 + 4.0, 4);
  b += bend;
  float w = 0.11 + 0.07 * exp(-l * l / 0.7) + 0.03 * fbm3(d * 1.5 + 9.0, 3);
  float band = exp(-pow(b / w, 2.0));
  float core = exp(-pow(b / (w * 0.42), 2.0));
  float bulge = exp(-(l * l / 0.05 + b * b / 0.014));
  float clouds = 0.5 + 0.5 * fbm3(d * 5.0 + 1.0, 6);
  float fine = 0.5 + 0.5 * fbm3(d * 18.0 + 7.0, 5);
  float density = band * (0.35 + 0.95 * clouds * clouds) * (0.75 + 0.5 * fine);

  // Dark dust: the rift along the middle and patchy clouds.
  float ridge = 1.0 - abs(fbm3(d * vec3(7.0, 7.0, 7.0) + 13.0, 6));
  float rift = pow(clamp(ridge, 0.0, 1.0), 5.0) * exp(-pow(b / (w * 0.5), 2.0));
  float patches = smoothstep(0.05, 0.5, fbm3(d * 9.0 + 21.0, 5)) * band;
  float dust = clamp(1.0 - 0.9 * rift - 0.55 * patches, 0.0, 1.0);

  vec3 cool = vec3(0.62, 0.72, 1.0);
  vec3 warm = vec3(1.0, 0.82, 0.62);
  vec3 col = mix(cool, warm, clamp(core * 0.6 + bulge * 1.5, 0.0, 1.0));
  col *= (density * 0.16 + bulge * 0.2 * (0.6 + 0.6 * clouds)) * dust;
  // Glowing hydrogen (H-alpha) and a little O-III along the plane.
  float ha = smoothstep(0.25, 0.75, fbm3(d * 6.0 + 41.0, 6)) * band;
  col += vec3(0.85, 0.16, 0.22) * ha * 0.05 * dust;
  col += vec3(0.15, 0.55, 0.6) * smoothstep(0.4, 0.8, fbm3(d * 4.0 + 77.0, 5)) * band * 0.018 * dust;
  // A very faint glow of unresolved galaxies everywhere.
  col += vec3(0.012, 0.012, 0.016) * (0.5 + 0.5 * fbm3(d * 3.0 + 55.0, 3));
  o = vec4(col, 1.0);
}
`;

export const SKY_FS = `${HEADER}
in vec3 v_ray;
out vec4 o;
uniform samplerCube u_sky;
uniform float u_bright;
void main() { o = vec4(texture(u_sky, normalize(v_ray)).rgb * u_bright, 1.0); }
`;

// ── Galaxies far away: billboards on the sky (direction only) ────────────────────────────────────
export const GALAXY_VS = `${HEADER}
layout(location = 0) in vec4 a_dir;     // direction xyz, angular radius
layout(location = 1) in vec4 a_shape;   // position angle, inclination, type (0 spiral 1 barred 2 elliptical), arms
layout(location = 2) in vec4 a_look;    // pitch, seed, brightness, warmth
uniform mat4 u_viewProj;                // rotation-only
uniform float u_time;
out vec2 v_c;
flat out vec4 v_shape;
flat out vec4 v_look;
void main() {
  vec2 c = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) * 2.0 - 1.0;
  vec3 d = normalize(a_dir.xyz);
  vec3 up = abs(d.y) > 0.95 ? vec3(1, 0, 0) : vec3(0, 1, 0);
  vec3 u = normalize(cross(up, d));
  vec3 v = cross(d, u);
  float t = tan(a_dir.w);
  vec3 p = d + (u * c.x + v * c.y) * t;
  gl_Position = u_viewProj * vec4(p, 1.0);
  v_c = c;
  v_shape = a_shape;
  v_look = a_look;
}
`;

export const GALAXY_FS = `${HEADER}
${NOISE}
in vec2 v_c;
flat in vec4 v_shape;
flat in vec4 v_look;
out vec4 o;
uniform float u_time;
uniform float u_bright;
void main() {
  float rc = length(v_c);
  if (rc > 1.0) discard;
  float pa = v_shape.x, incl = v_shape.y, type = v_shape.z, arms = v_shape.w;
  float seed = v_look.y;
  mat2 rot = mat2(cos(pa), sin(pa), -sin(pa), cos(pa));
  vec2 p = rot * v_c;
  vec2 q = vec2(p.x, p.y / max(cos(incl), 0.06));
  float r = length(q);
  vec3 coreCol = mix(vec3(1.0, 0.9, 0.76), vec3(1.0, 0.8, 0.6), v_look.w);
  vec3 armCol = mix(vec3(0.6, 0.7, 1.0), vec3(0.78, 0.8, 0.95), v_look.w);
  vec3 col;
  if (type > 1.5) {
    // Elliptical: smooth, warm, no arms.
    float re = length(vec2(p.x, p.y / 0.7));
    col = coreCol * (exp(-re * 7.0) * 1.2 + exp(-re * 22.0) * 2.5);
  } else {
    float th = atan(q.y, q.x) + u_time * 0.004 * (1.0 + seed);
    float rr = type > 0.5 ? max(r, 0.18) : r;
    float phase = arms * (th - log(rr + 0.02) / tan(v_look.x));
    float wob = fbm2(q * 4.0 + seed * 3.0, 5) - 0.5;
    float arm = pow(0.5 + 0.5 * cos(phase + wob * 4.5), 2.0);
    float lane = pow(0.5 + 0.5 * cos(phase + wob * 4.5 + 0.9), 7.0);
    float disk = exp(-r / 0.22) + 0.3 * exp(-r / 0.45);
    // Patchy: star-forming clumps along the arms, grainy unresolved stars in the disk.
    float clump = pow(clamp(fbm2(q * 13.0 + seed * 13.0, 6) * 1.6 - 0.25, 0.0, 1.5), 1.5);
    float grain = 0.8 + 0.4 * vnoise(q * 90.0 + seed * 31.0);
    float bar = type > 0.5 ? exp(-(pow(q.x / 0.3, 2.0) + pow(q.y / 0.06, 2.0))) : 0.0;
    float bulge = exp(-length(p) / 0.035) * 1.3 + exp(-length(p) / 0.11) * 0.4;
    float knots = pow(clamp((fbm2(q * 26.0 + seed * 7.0, 4) - 0.55) / 0.45, 0.0, 1.0), 2.0) * arm;
    float dust = 1.0 - 0.8 * lane * smoothstep(0.06, 0.22, r) * smoothstep(1.0, 0.35, r);
    col = armCol * disk * (0.3 + 1.5 * arm * clump) * dust * grain * 1.1;
    col += coreCol * (bulge + bar * 0.35);
    col += vec3(1.0, 0.42, 0.62) * knots * disk * 1.4;
    // Edge-on: a dark dust lane through the middle.
    float edge = smoothstep(1.1, 1.45, incl);
    col *= 1.0 - 0.85 * edge * exp(-pow(p.y / 0.018, 2.0)) * smoothstep(0.03, 0.12, abs(p.x));
  }
  col *= v_look.z * smoothstep(1.0, 0.55, rc) * u_bright;
  o = vec4(col, 0.0);
}
`;

// ── Stars: the far sky (direction only) and nearby stars flying past (3D, with motion blur) ──────
export const SKY_STARS_VS = `${HEADER}
${STAR_COLOUR}
layout(location = 0) in vec4 a_star;    // direction xyz, magnitude 0–1
layout(location = 1) in float a_temp;
uniform mat4 u_viewProj;               // rotation-only
uniform mat4 u_viewProjNext;           // the same a shutter-time later: stars streak as the camera turns
uniform vec2 u_res;
uniform float u_bright;
out vec2 v_p;
out vec4 v_seg;
out vec3 v_col;
vec2 toPx(vec4 clip) { return (clip.xy / clip.w * 0.5 + 0.5) * u_res; }
void main() {
  vec2 c = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) * 2.0 - 1.0;
  vec4 ch = u_viewProj * vec4(a_star.xyz, 1.0);
  vec4 ct = u_viewProjNext * vec4(a_star.xyz, 1.0);
  if (ch.w < 0.05 || ct.w < 0.05) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  vec2 head = toPx(ch), tail = toPx(ct);
  float m = a_star.w;
  float reach = mix(1.1, 3.2, m * m) + 1.5;
  vec2 d = tail - head;
  float len = length(d);
  vec2 dir = len > 0.001 ? d / len : vec2(1.0, 0.0);
  vec2 px = (head + tail) * 0.5 + dir * c.x * (len * 0.5 + reach) + vec2(-dir.y, dir.x) * c.y * reach;
  gl_Position = vec4((px / u_res) * 2.0 - 1.0, 0.0, 1.0);
  v_p = px;
  v_seg = vec4(head, tail);
  // A streak spreads the star's light along its length.
  v_col = starColour(a_temp) * (0.05 + 1.6 * pow(m, 2.2)) * sqrt(1.6 / (len + 1.6)) * u_bright;
}
`;

export const SKY_STARS_FS = `${HEADER}
in vec2 v_p;
in vec4 v_seg;
in vec3 v_col;
out vec4 o;
void main() {
  vec2 pa = v_p - v_seg.xy, ba = v_seg.zw - v_seg.xy;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0);
  vec2 q = pa - ba * h;
  float a = exp(-dot(q, q) * 1.1);
  o = vec4(v_col * a, 0.0);
}
`;

export const NEAR_STARS_VS = `${HEADER}
${STAR_COLOUR}
layout(location = 0) in vec4 a_star;    // position in the cube, magnitude
layout(location = 1) in float a_temp;
uniform mat4 u_view;
uniform mat4 u_proj;
uniform vec3 u_camMod;                  // camera position modulo the cube
uniform float u_wrap;                   // 1: the endless field; 0: a star cluster at u_origin
uniform vec3 u_origin;
uniform mat4 u_viewNext;                // the view a shutter-time later (the camera may be turning)
uniform vec3 u_move;                    // camera displacement during the shutter (world)
uniform float u_cube;
uniform vec2 u_res;
uniform float u_bright;
out vec2 v_p;
out vec4 v_seg;
out float v_w;
out vec3 v_col;
vec2 toPx(vec4 clip) { return (clip.xy / clip.w * 0.5 + 0.5) * u_res; }
void main() {
  vec2 c = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) * 2.0 - 1.0;
  vec3 rel = u_wrap > 0.5 ? mod(a_star.xyz - u_camMod + u_cube * 0.5, u_cube) - u_cube * 0.5 : a_star.xyz + u_origin;
  vec3 vp = (u_view * vec4(rel, 0.0)).xyz;
  vec3 vprev = (u_viewNext * vec4(rel - u_move, 0.0)).xyz;
  float dist = length(rel);
  if (vp.z > -0.5 || vprev.z > -0.3) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  vec4 ch = u_proj * vec4(vp, 1.0);
  vec4 ct = u_proj * vec4(vprev, 1.0);
  vec2 head = toPx(ch), tail = toPx(ct);
  float m = a_star.w;
  float w = mix(0.9, 1.7, m) + 4.0 / max(dist, 4.0);
  float len = length(head - tail);
  float spread = sqrt(clamp((w * 3.0) / (len + w * 3.0), 0.02, 1.0));
  float bright = (0.08 + 2.2 * pow(m, 2.5)) * clamp(2500.0 / (dist * dist), 0.0, u_wrap > 0.5 ? 8.0 : 3.0);
  bright *= u_wrap > 0.5 ? smoothstep(u_cube * 0.5, u_cube * 0.36, dist) : smoothstep(3000.0, 1500.0, dist) * 1.1;
  v_col = starColour(a_temp) * bright * mix(spread, 1.0, 0.2) * u_bright;
  vec2 d = head - tail;
  vec2 dir = len > 0.001 ? d / len : vec2(1.0, 0.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  float reach = w * 3.0;
  vec2 px = (head + tail) * 0.5 + dir * c.x * (len * 0.5 + reach) + nrm * c.y * reach;
  v_p = px;
  v_seg = vec4(tail, head);
  v_w = w;
  gl_Position = vec4((px / u_res) * 2.0 - 1.0, 0.0, 1.0);
}
`;

export const NEAR_STARS_FS = `${HEADER}
in vec2 v_p;
in vec4 v_seg;
in float v_w;
in vec3 v_col;
out vec4 o;
void main() {
  vec2 pa = v_p - v_seg.xy, ba = v_seg.zw - v_seg.xy;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0);
  float d = length(pa - ba * h) / v_w;
  float a = (exp(-d * d * 1.2) + 0.03 * exp(-d * 0.6)) * mix(0.15, 1.0, h * h);
  o = vec4(v_col * a, 0.0);
}
`;

// ── The nearest star: core, glow and diffraction spikes ──────────────────────────────────────────
export const SUN_VS = `${HEADER}
uniform mat4 u_viewProj;
uniform vec3 u_dir;
uniform vec2 u_res;
uniform float u_size;
out vec2 v_c;
void main() {
  vec2 c = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) * 2.0 - 1.0;
  vec4 clip = u_viewProj * vec4(u_dir, 1.0);
  clip.xy += c * u_size / u_res * 2.0 * clip.w;
  gl_Position = clip;
  v_c = c;
}
`;

export const SUN_FS = `${HEADER}
in vec2 v_c;
out vec4 o;
uniform float u_power;
uniform vec3 u_colour;
void main() {
  float r = length(v_c);
  float core = exp(-r * r * 900.0) * 30.0;
  float glow = exp(-r * 9.0) * 1.2 + exp(-r * 3.0) * 0.12;
  float spikes = 0.0;
  for (int i = 0; i < 3; i++) {
    float a = float(i) * 1.0472 + 0.26;
    vec2 dir = vec2(cos(a), sin(a));
    float across = abs(dot(v_c, vec2(-dir.y, dir.x)));
    spikes += exp(-across * 260.0) * exp(-r * 4.5);
  }
  vec3 col = u_colour * (core + glow + spikes * 1.4) * u_power * smoothstep(1.0, 0.8, r);
  o = vec4(col, 0.0);
}
`;

// ── Baked once per planet: equirectangular surface (rgb albedo, a ocean) and clouds/lights ───────
// One small program per group of worlds (a single big one takes far too long to compile on Windows).
const planetBake = (body: string, extra = '') => `${HEADER}
${NOISE}
in vec2 v_uv;
layout(location = 0) out vec4 o0;
layout(location = 1) out vec4 o1;
uniform int u_kind;
uniform float u_seed;
const float PI = 3.14159265;
vec3 ramp(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  t = clamp(t, 0.0, 1.0) * 3.0;
  return t < 1.0 ? mix(a, b, t) : t < 2.0 ? mix(b, c, t - 1.0) : mix(c, d, t - 2.0);
}
${extra}
void main() {
  float lon = (v_uv.x - 0.5) * 2.0 * PI;
  float lat = (v_uv.y - 0.5) * PI;
  vec3 d = vec3(cos(lat) * cos(lon), sin(lat), cos(lat) * sin(lon));
  vec3 s = vec3(u_seed * 17.0, u_seed * 31.0, u_seed * 7.0);
  vec4 a = vec4(0.0), b = vec4(0.0, 0.0, 0.0, 1.0);
${body}
  o0 = a;
  o1 = b;
}
`;
const CRATERS = `
float craters(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  float k = 0.0;
  for (int x = -1; x <= 1; x++)
  for (int y = -1; y <= 1; y++)
  for (int z = -1; z <= 1; z++) {
    vec3 g = vec3(float(x), float(y), float(z));
    vec3 h = hash33(i + g) * 0.5 + 0.5;
    // Craters of many sizes, some fresh and bright, most old and soft.
    float size = 0.08 + 0.38 * h.x * h.x;
    float d = length(g + h - f) / size;
    float fresh = step(0.8, h.y);
    if (d < 1.4) k += (d < 1.0 ? (d * d - 1.0) * mix(0.22, -0.1, fresh) : (1.0 - (d - 1.0) / 0.4) * mix(0.12, 0.3, fresh));
  }
  return k;
}
`;

export const PLANET_BAKE = {
  /** Earth: oceans, continents, deserts, mountains, ice; clouds and city lights. */
  terran: planetBake(`
    // Terran: oceans, continents, deserts, mountains, ice; clouds and city lights.
    float h = fbm3(d * 1.7 + s, 8) + 0.25 * fbm3(d * 5.0 + s * 2.0, 6);
    float land = smoothstep(0.02, 0.05, h);
    vec3 ocean = mix(vec3(0.004, 0.025, 0.07), vec3(0.02, 0.12, 0.2), smoothstep(-0.25, 0.03, h));
    float dry = smoothstep(0.0, 0.35, fbm3(d * 2.6 + s * 3.0, 5)) * (1.0 - smoothstep(0.35, 0.75, abs(lat)));
    vec3 green = mix(vec3(0.05, 0.12, 0.035), vec3(0.11, 0.15, 0.06), 0.5 + 0.5 * fbm3(d * 9.0 + s, 4));
    vec3 desert = mix(vec3(0.42, 0.32, 0.19), vec3(0.6, 0.46, 0.3), 0.5 + 0.5 * fbm3(d * 12.0 + s, 4));
    vec3 ground = mix(green, desert, dry);
    ground = mix(ground, vec3(0.28, 0.24, 0.2), smoothstep(0.22, 0.4, h));
    float ice = smoothstep(1.05, 1.2, abs(lat) + 0.12 * fbm3(d * 6.0 + s, 4)) + smoothstep(0.42, 0.55, h);
    vec3 col = mix(ocean, ground, land);
    col = mix(col, vec3(0.85, 0.88, 0.92), clamp(ice, 0.0, 1.0));
    a = vec4(col, (1.0 - land) * (1.0 - clamp(ice, 0.0, 1.0)));
    vec3 w = d * 2.2 + 0.6 * vec3(fbm3(d * 3.0 + 3.0, 4), fbm3(d * 3.0 + 9.0, 4), fbm3(d * 3.0 + 1.0, 4));
    float cl = smoothstep(0.02, 0.42, fbm3(w + s * 0.7, 8) + 0.15 * (1.0 - abs(lat)));
    float cities = land * (1.0 - clamp(ice, 0.0, 1.0)) * smoothstep(0.02, 0.07, h) * (1.0 - smoothstep(0.2, 0.32, h));
    float towns = smoothstep(0.82, 0.97, hash13(floor(d * 220.0 + s)));
    cities *= towns * smoothstep(0.1, 0.5, 0.5 + 0.5 * fbm3(d * 9.0 + s, 4)) * 1.6;
    b = vec4(cl, cities, 0.0, 1.0);
`),
  /** Jupiter, Saturn, Neptune, Uranus. */
  giant: planetBake(`
    // Giants: turbulent latitude bands (Jupiter's Great Red Spot, Neptune's dark spot and cirrus).
    vec3 st = vec3(d.x * 2.0, d.y * 9.0, d.z * 2.0);
    float turb = fbm3(st + s, 7);
    float flow = fbm3(vec3(d.x * 6.0, d.y * 30.0, d.z * 6.0) + s * 2.0 + turb * 1.5, 7);
    float eddies = fbm3(vec3(d.x * 18.0, d.y * 60.0, d.z * 18.0) + s * 3.0 + flow * 2.0, 6)
                 + 0.5 * fbm3(vec3(d.x * 45.0, d.y * 140.0, d.z * 45.0) + s * 4.0 + flow * 3.0, 4);
    float freq = u_kind == 4 ? 9.0 : u_kind == 8 ? 5.0 : 16.0;
    float bands = 0.5 + 0.5 * sin(lat * freq + turb * 2.6 + flow * 0.8);
    vec3 col;
    if (u_kind == 1) col = ramp(bands, vec3(0.42, 0.22, 0.12), vec3(0.66, 0.42, 0.26), vec3(0.86, 0.74, 0.58), vec3(0.94, 0.9, 0.82));
    else if (u_kind == 2) col = ramp(bands, vec3(0.62, 0.52, 0.36), vec3(0.78, 0.68, 0.5), vec3(0.88, 0.8, 0.62), vec3(0.93, 0.88, 0.74));
    else if (u_kind == 4) col = ramp(bands * 0.8, vec3(0.05, 0.13, 0.38), vec3(0.09, 0.22, 0.55), vec3(0.16, 0.34, 0.7), vec3(0.28, 0.48, 0.82));
    else col = ramp(0.55 + 0.2 * bands, vec3(0.5, 0.72, 0.78), vec3(0.58, 0.8, 0.84), vec3(0.66, 0.86, 0.88), vec3(0.74, 0.9, 0.92));
    col *= u_kind == 8 ? 0.97 + 0.04 * flow : 0.84 + 0.24 * flow + 0.14 * eddies;
    if (u_kind == 1) {
      vec2 e = vec2((lon - 1.2) * cos(lat) * 1.1, (lat + 0.38) * 2.4);
      float spot = smoothstep(0.2, 0.08, length(e) + 0.05 * turb);
      col = mix(col, vec3(0.72, 0.33, 0.2) * (0.85 + 0.3 * flow), spot);
    }
    if (u_kind == 4) {
      vec2 e = vec2((lon + 0.6) * cos(lat) * 1.3, (lat + 0.35) * 3.0);
      col = mix(col, vec3(0.04, 0.08, 0.26), smoothstep(0.18, 0.08, length(e) + 0.05 * turb));
      float cirrus = pow(clamp(fbm3(vec3(d.x * 4.0, d.y * 40.0, d.z * 4.0) + s * 5.0, 5) + 0.15, 0.0, 1.0), 3.0);
      col = mix(col, vec3(0.88, 0.92, 1.0), smoothstep(0.35, 0.8, cirrus) * 0.55 * smoothstep(0.1, 0.4, abs(lat)));
    }
    a = vec4(col, 0.0);
    b = vec4(0.0, 0.0, 0.0, 1.0);
`),
  venus: planetBake(`
    // Venus: a world of thick, yellowish cloud swirling in broad bands.
    vec3 w = d * 2.0 + 0.8 * vec3(fbm3(d * 2.5 + 3.0, 4), fbm3(d * 2.5 + 7.0, 4), fbm3(d * 2.5 + 11.0, 4));
    float c = 0.5 + 0.5 * fbm3(vec3(w.x * 1.5, w.y * 4.5, w.z * 1.5) + s, 7);
    float vee = 0.5 + 0.5 * sin(lat * 7.0 + 2.5 * fbm3(d * 2.0 + s * 2.0, 4) + abs(lon) * 0.6);
    vec3 col = mix(vec3(0.6, 0.47, 0.27), vec3(0.85, 0.74, 0.5), smoothstep(0.15, 0.85, c * 0.7 + vee * 0.3));
    a = vec4(col, 0.0);
    b = vec4(0.0, 0.0, 0.0, 1.0);
`),
  /** Io, Europa, Titan. */
  moons: planetBake(`
  if (u_kind == 9) {
    // Io: sulphur yellows and oranges, dark volcanic spots with red rings.
    vec3 col = mix(vec3(0.82, 0.72, 0.3), vec3(0.95, 0.9, 0.56), 0.5 + 0.5 * fbm3(d * 4.0 + s, 6));
    col = mix(col, vec3(0.74, 0.44, 0.17), smoothstep(0.1, 0.5, fbm3(d * 3.0 + s * 2.0, 5)) * 0.6);
    vec3 g = d * 8.0 + s;
    vec3 f3 = fract(g) - 0.5;
    float pick = step(0.72, hash13(floor(g)));
    col = mix(col, vec3(0.7, 0.28, 0.1), smoothstep(0.34, 0.2, length(f3)) * pick * 0.5);
    col = mix(col, vec3(0.12, 0.07, 0.04), smoothstep(0.16, 0.05, length(f3)) * pick * 0.9);
    a = vec4(col, 0.0);
    b = vec4(0.0, 0.0, 0.0, 1.0);
  } else if (u_kind == 10) {
    // Europa: bright ice crossed by reddish-brown cracks.
    vec3 col = mix(vec3(0.8, 0.76, 0.68), vec3(0.95, 0.93, 0.88), 0.5 + 0.5 * fbm3(d * 3.0 + s, 5));
    float lines = pow(1.0 - abs(fbm3(d * 5.0 + s, 5)), 14.0) + pow(1.0 - abs(fbm3(d * 9.0 + s * 2.0, 4)), 18.0) * 0.7;
    col = mix(col, vec3(0.55, 0.33, 0.2), clamp(lines, 0.0, 1.0) * 0.8);
    col = mix(col, vec3(0.64, 0.48, 0.34), smoothstep(0.2, 0.6, fbm3(d * 2.0 + s * 3.0, 4)) * 0.35);
    a = vec4(col, 0.0);
    b = vec4(0.0, 0.0, 0.0, 1.0);
  } else if (u_kind == 11) {
    // Titan: hidden under an orange haze.
    float h = fbm3(vec3(d.x * 2.0, d.y * 5.0, d.z * 2.0) + s, 5);
    vec3 col = mix(vec3(0.72, 0.47, 0.2), vec3(0.86, 0.63, 0.32), 0.5 + 0.25 * h);
    a = vec4(col, 0.0);
    b = vec4(0.0, 0.0, 0.0, 1.0);
  }
`),
  /** Mars, the Moon, Mercury, Triton. */
  rocky: planetBake(
    `
    // Rocky worlds: Mars (rust, dark plains, polar caps), the Moon, Mercury, Triton.
    float h = fbm3(d * 2.2 + s, 8);
    float k = craters(d * 5.0 + s) + 0.6 * craters(d * 13.0 + s * 3.0) + 0.35 * craters(d * 31.0 + s * 5.0);
    vec3 col;
    if (u_kind == 3) {
      col = ramp(0.5 + 0.6 * h + 0.12 * k, vec3(0.22, 0.09, 0.05), vec3(0.42, 0.16, 0.07), vec3(0.58, 0.25, 0.11), vec3(0.68, 0.38, 0.22));
      col = mix(col, vec3(0.16, 0.08, 0.05), smoothstep(0.0, 0.3, fbm3(d * 1.3 + s * 4.0, 6)) * 0.75);
      col = mix(col, vec3(0.92, 0.9, 0.88), smoothstep(1.28, 1.38, abs(lat) + 0.08 * h));
    } else if (u_kind == 6) {
      col = mix(vec3(0.36, 0.33, 0.3), vec3(0.46, 0.41, 0.36), 0.5 + 0.5 * fbm3(d * 3.0 + s * 2.0, 5)) * (0.82 + 0.35 * h + 0.5 * k);
    } else if (u_kind == 12) {
      col = mix(vec3(0.7, 0.6, 0.58), vec3(0.88, 0.82, 0.8), 0.5 + 0.5 * h) * (0.9 + 0.2 * k);
      col = mix(col, vec3(0.55, 0.42, 0.4), smoothstep(0.2, 0.5, fbm3(d * 4.0 + s, 4)) * 0.4);
    } else {
      col = mix(vec3(0.3, 0.3, 0.3), vec3(0.42, 0.41, 0.4), smoothstep(-0.2, 0.3, fbm3(d * 1.5 + s, 5))) * (0.82 + 0.35 * h + 0.5 * k);
    }
    a = vec4(col, 0.0);
    b = vec4(0.0, 0.0, 0.0, 1.0);
`,
    CRATERS,
  ),
};

// ── Planets: ray-traced spheres with the baked surface, atmosphere, rings and their shadows ──────
export const PLANET_FS = `${HEADER}
in vec3 v_ray;
out vec4 o;
uniform sampler2D u_surface;
uniform sampler2D u_clouds;      // Earth's clouds (red channel)
uniform sampler2D u_lights;      // Earth's city lights (the channel u_lightsMask picks)
uniform vec4 u_lightsMask;
uniform sampler2D u_ringMap;     // Saturn's rings, inner to outer: colour and opacity
uniform float u_ringMapOn;
uniform vec3 u_photometry;       // x: weight of the airless-world (Lommel–Seeliger) law; y: limb darkening; z: exposure
uniform vec3 u_centre;
uniform float u_radius;
uniform mat3 u_spin;            // world → planet frame (rotation included)
uniform float u_cloudSpin;
uniform vec3 u_sun;
uniform vec4 u_atmo;            // colour, thickness (fraction of the radius)
uniform float u_terran;
uniform vec4 u_ring;            // inner, outer (radii), opacity (0 = none), style (0 broad, 1 thin dark rings)
uniform vec3 u_ringNormal;
uniform float u_bright;
uniform float u_vis;
uniform float u_pixel;          // one pixel's angle (radians)
const float PI = 3.14159265;
float rhash(float n) { return fract(sin(n * 127.1) * 43758.5453); }
float rnoise(float x) { float i = floor(x), f = fract(x); return mix(rhash(i), rhash(i + 1.0), f * f * (3.0 - 2.0 * f)); }
float ringDensity(float r) {
  float x = (r - u_ring.x) / (u_ring.y - u_ring.x);
  if (x < 0.0 || x > 1.0) return 0.0;
  if (u_ringMapOn > 0.5) return texture(u_ringMap, vec2(x, 0.5)).a * u_ring.z;
  if (u_ring.w > 0.5) {
    // Uranus: a few thin, narrow rings.
    float t = 0.0;
    for (int i = 0; i < 5; i++) {
      float c = 0.12 + 0.19 * float(i) + 0.03 * sin(float(i) * 7.0);
      t += exp(-pow((x - c) * (i == 4 ? 70.0 : 140.0), 2.0)) * (i == 4 ? 1.0 : 0.55 + 0.1 * float(i));
    }
    return clamp(t, 0.0, 1.0) * u_ring.z;
  }
  float d = 0.25 + 0.45 * rnoise(x * 18.0) + 0.25 * rnoise(x * 70.0 + 3.0) + 0.15 * rnoise(x * 260.0 + 7.0);
  d *= mix(0.55, 1.0, smoothstep(0.15, 0.4, x));   // a fainter inner ring
  d *= smoothstep(0.0, 0.08, x) * smoothstep(1.0, 0.9, x);
  d *= 1.0 - 0.95 * smoothstep(0.57, 0.585, x) * (1.0 - smoothstep(0.62, 0.635, x));   // a gap
  return clamp(d, 0.0, 1.0) * u_ring.z;
}
bool hitSphere(vec3 ro, vec3 rd, vec3 c, float r, out float t) {
  vec3 oc = ro - c;
  float b = dot(oc, rd);
  float h = b * b - (dot(oc, oc) - r * r);
  if (h < 0.0) return false;
  t = -b - sqrt(h);
  return t > 0.0;
}
void main() {
  vec3 rd = normalize(v_ray);
  vec3 C = u_centre;
  float R = u_radius;
  float tb = dot(C, rd);
  float closest = length(C - rd * tb);
  float tPlanet = 1e30;
  vec4 body = vec4(0.0);
  vec3 add = vec3(0.0);
  float tHit;
  if (tb > 0.0 && hitSphere(vec3(0.0), rd, C, R, tHit)) {
    tPlanet = tHit;
    vec3 P = rd * tHit;
    vec3 n = normalize(P - C);
    vec3 local = u_spin * n;
    // Longitude grows eastward (z is west of x in this frame), as on real maps.
    vec2 uv = vec2(atan(-local.z, local.x) / (2.0 * PI) + 0.5, asin(clamp(local.y, -1.0, 1.0)) / PI + 0.5);
    // Mip level from a longitude that doesn't jump at the seam (no line where the texture wraps).
    vec2 dx = dFdx(uv), dy = dFdy(uv);
    vec2 uvB = vec2(fract(uv.x + 0.5), uv.y);
    vec2 dxB = dFdx(uvB), dyB = dFdy(uvB);
    if (abs(dxB.x) < abs(dx.x)) dx.x = dxB.x;
    if (abs(dyB.x) < abs(dy.x)) dy.x = dyB.x;
    vec4 surf = textureGrad(u_surface, uv, dx, dy);
    vec3 albedo = surf.rgb;
    float NdotL = dot(n, u_sun);
    // Lambert, with a terminator softened by a few degrees (the sun is not a point; and atmospheres).
    float mu0 = smoothstep(-0.06, 0.3, NdotL) * max(NdotL + 0.06, 0.0) / 1.06;
    float mu = max(dot(n, -rd), 0.0);
    // Airless rocky worlds stay evenly bright to the limb (Lommel–Seeliger, capped so the lit limb
    // does not glare); gas giants and cloud decks darken a little towards it.
    float ls = min(2.0 * mu0 / max(mu0 + mu, 1e-3), 1.25);
    float lambert = mu0 * mix(1.0, pow(mu, 0.4), u_photometry.y);
    float light = mix(lambert, ls, u_photometry.x);
    float cl = 0.0;
    vec4 extra = vec4(0.0);
    if (u_terran > 0.5) {
      extra = textureGrad(u_clouds, uv - vec2(u_cloudSpin, 0.0), dx, dy);
      cl = extra.r;
      vec4 under = textureGrad(u_clouds, uv - vec2(u_cloudSpin, 0.0) + vec2(0.0015, 0.0006), dx, dy);
      albedo = mix(albedo, vec3(0.92, 0.93, 0.95), cl * 0.92);
      light *= 1.0 - 0.2 * under.r * (1.0 - cl);
    }
    vec3 col = albedo * light * u_photometry.z;
    // The sun's glint on Earth's oceans.
    // (A small, soft sunglint: sea roughness spreads it; it is not a mirror.)
    float spec = pow(max(dot(reflect(-u_sun, n), -rd), 0.0), 240.0) * surf.a * (1.0 - cl) * u_terran;
    col += vec3(1.0, 0.95, 0.85) * spec * 0.45 * smoothstep(0.0, 0.2, NdotL);
    // City lights on the night side.
    float city = dot(textureGrad(u_lights, uv, dx, dy), u_lightsMask) * u_terran;
    col += vec3(1.0, 0.7, 0.36) * city * (1.0 - smoothstep(-0.25, -0.02, NdotL)) * (1.0 - cl) * 0.55;
    // Atmosphere: hazy at the limb, brighter towards the sun.
    float fres = pow(1.0 - max(dot(n, -rd), 0.0), 4.0);
    col = mix(col, u_atmo.rgb * smoothstep(-0.1, 0.6, NdotL) * 0.9, fres * 0.5 * step(0.001, u_atmo.w));
    // The ring's shadow on the planet.
    if (u_ring.z > 0.0) {
      float dn = dot(u_sun, u_ringNormal);
      if (abs(dn) > 1e-3) {
        float ts = dot(C - P, u_ringNormal) / dn;
        if (ts > 0.0) col *= 1.0 - 0.8 * ringDensity(length(P + u_sun * ts - C) / R);
      }
    }
    // Antialiased edge: partial coverage within a pixel of the limb.
    float cover = clamp((R - closest) / max(tb * u_pixel, 1e-4) + 0.5, 0.0, 1.0);
    body = vec4(col, 1.0) * cover;
  }
  // Far away, a world is a point of light before it is a disk (its average colour, from the last mip).
  float pr = R / max(tb * u_pixel, 1e-6);
  if (tb > 0.0 && pr < 2.0) {
    vec3 avg = textureLod(u_surface, vec2(0.5), 12.0).rgb;
    float dpx = closest / max(tb * u_pixel, 1e-6);
    add += avg * 1.8 * min(1.0, pr * pr * 4.0) * exp(-dpx * dpx * 0.8) * (1.0 - smoothstep(1.0, 2.0, pr));
  }
  // The glow of the atmosphere around the limb.
  // (Outside the body only: the halo fades with height above the surface.)
  // (Blended into the antialiased edge, so there is no bright line along the limb.)
  if (u_atmo.w > 0.0 && tb > 0.0 && closest > R * 0.98 && closest < R * (1.0 + u_atmo.w * 4.0)) {
    vec3 limb = normalize(rd * tb - C);
    float lit = smoothstep(-0.35, 0.6, dot(limb, u_sun));
    add += u_atmo.rgb * exp(-max(closest - R, 0.0) / (R * u_atmo.w * 0.5)) * lit * 0.4 * (1.0 - body.a);
  }
  // Rings: in front of the planet, or behind it (hidden by the body).
  if (u_ring.z > 0.0) {
    float dn = dot(rd, u_ringNormal);
    if (abs(dn) > 1e-4) {
      float tr = dot(C, u_ringNormal) / dn;
      if (tr > 0.0) {
        vec3 Pr = rd * tr;
        float dens = ringDensity(length(Pr - C) / R);
        if (dens > 0.0) {
          float ts;
          float shadow = hitSphere(Pr, u_sun, C, R, ts) ? 0.08 : 1.0;
          float rx = (length(Pr - C) / R - u_ring.x) / (u_ring.y - u_ring.x);
          vec3 rc = u_ringMapOn > 0.5
            ? texture(u_ringMap, vec2(rx, 0.5)).rgb
            : mix(vec3(0.78, 0.71, 0.6), vec3(0.62, 0.56, 0.49), rnoise(length(Pr - C) / R * 12.0));
          if (u_ring.w > 0.5) rc = vec3(0.16, 0.17, 0.18);
          rc *= (0.35 + 0.9 * abs(dot(u_sun, u_ringNormal))) * shadow * 1.4;
          vec4 ring = vec4(rc * dens, dens);
          if (tr < tPlanet) body = ring + body * (1.0 - ring.a);
          else if (body.a < 0.5) body = ring;
        }
      }
    }
  }
  o = vec4((body.rgb + add) * u_bright, body.a * u_vis);
}
`;

// ── Nebulae: baked cloud textures (4 variants in an atlas), drawn as huge billboards we fly through ─
export const NEBULA_BAKE_FS = `${HEADER}
${NOISE}
in vec2 v_uv;
out vec4 o;
void main() {
  vec2 cell = floor(v_uv * 2.0);
  vec2 p = fract(v_uv * 2.0) * 2.0 - 1.0;
  float s = cell.x * 13.0 + cell.y * 29.0 + 3.0;
  vec3 q3 = vec3(p * 1.4, s);
  vec3 warp = vec3(fbm3(q3 + 1.0, 5), fbm3(q3 + 7.0, 5), 0.0) * 1.1;
  vec3 q = q3 + warp;
  float edge = length(p) + 0.35 * fbm3(vec3(p * 2.0, s + 4.0), 4);
  float mask = smoothstep(1.0, 0.3, edge);
  float base = 0.5 + 0.5 * fbm3(q * 1.8, 7);
  float fil = 1.0 - abs(fbm3(q * 3.2 + 5.0, 6));
  float wisps = pow(fil, 4.0) * (0.5 + 0.5 * fbm3(q * 6.0 + 2.0, 5));
  float emission = (pow(clamp(base * 1.5 - 0.42, 0.0, 1.0), 2.6) * 1.2 + wisps * 0.45) * mask;
  float second = pow(clamp((0.5 + 0.5 * fbm3(q * 3.8 + 11.0, 6)) * 1.6 - 0.6, 0.0, 1.0), 2.2) * mask;
  float dust = smoothstep(0.56, 0.82, 0.5 + 0.5 * fbm3(q * 2.4 + 19.0, 6)) * mask;
  o = vec4(emission, second, dust, mask);
}
`;

export const NEBULA_VS = `${HEADER}
layout(location = 0) in vec4 a_pos;     // camera-relative centre, size
layout(location = 1) in vec4 a_look;    // rotation, variant (0–3), brightness, fade
layout(location = 2) in vec4 a_colA;    // main emission colour, dust opacity
layout(location = 3) in vec3 a_colB;    // secondary emission colour
uniform mat4 u_view;
uniform mat4 u_proj;
out vec2 v_uv;
out vec4 v_look;
out vec4 v_colA;
out vec3 v_colB;
void main() {
  vec2 c = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) * 2.0 - 1.0;
  float r = a_look.x;
  vec2 rc = mat2(cos(r), sin(r), -sin(r), cos(r)) * c;
  // The cloud faces us (square to the line of sight, upright in the world), so it looks the same
  // whichever way the camera turns: only moving changes how we see it.
  vec3 dir = normalize(a_pos.xyz);
  vec3 side = normalize(cross(dir, abs(dir.y) < 0.95 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
  vec3 up = cross(side, dir);
  vec3 world = a_pos.xyz + (side * rc.x + up * rc.y) * a_pos.w;
  gl_Position = u_proj * u_view * vec4(world, 1.0);
  float v = a_look.y;
  v_uv = (vec2(mod(v, 2.0), floor(v / 2.0)) + c * 0.5 + 0.5) * 0.5;
  v_look = a_look;
  v_colA = a_colA;
  v_colB = a_colB;
}
`;

export const NEBULA_FS = `${HEADER}
in vec2 v_uv;
in vec4 v_look;
in vec4 v_colA;
in vec3 v_colB;
out vec4 o;
uniform sampler2D u_tex;
uniform float u_bright;
void main() {
  vec4 t = texture(u_tex, v_uv);
  float fade = v_look.w;
  vec3 em = (v_colA.rgb * t.r + v_colB * t.g * 1.8) * v_look.z * (1.0 - 0.6 * t.b);
  float dust = t.b * v_colA.a;
  o = vec4(em * fade * u_bright, dust * fade);
}
`;

// ── Asteroids: lumpy, cratered rocks lit by the sun (impostors, tumbling) ─────────────────────────
export const ROCK_VS = `${HEADER}
layout(location = 0) in vec4 a_rock;    // position relative to the belt, radius
layout(location = 1) in vec4 a_spin;    // axis xyz, seed
uniform mat4 u_view;
uniform mat4 u_proj;
uniform vec3 u_origin;
uniform float u_time;
uniform float u_far;
out vec2 v_c;
flat out vec4 v_spin;
flat out float v_fade;
flat out float v_angle;
void main() {
  vec2 c = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) * 2.0 - 1.0;
  vec3 rel = u_origin + a_rock.xyz;
  vec3 vc = (u_view * vec4(rel, 1.0)).xyz;
  float dist = length(rel);
  v_fade = smoothstep(u_far, u_far * 0.7, dist) * smoothstep(0.5, 3.0, -vc.z);
  gl_Position = u_proj * vec4(vc + vec3(c * a_rock.w * 1.35, 0.0), 1.0);
  if (v_fade <= 0.001 || vc.z > -0.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  v_c = c * 1.35;
  v_spin = a_spin;
  v_angle = u_time * (0.15 + 0.5 * fract(a_spin.w * 7.3));
}
`;

export const ROCK_FS = `${HEADER}
${NOISE}
in vec2 v_c;
flat in vec4 v_spin;
flat in float v_fade;
flat in float v_angle;
out vec4 o;
uniform vec3 u_sunView;
uniform float u_bright;
uniform float u_vis;
mat3 axisAngle(vec3 a, float t) {
  a = normalize(a);
  float c = cos(t), s = sin(t), k = 1.0 - c;
  return mat3(c + a.x * a.x * k, a.y * a.x * k + a.z * s, a.z * a.x * k - a.y * s,
              a.x * a.y * k - a.z * s, c + a.y * a.y * k, a.z * a.y * k + a.x * s,
              a.x * a.z * k + a.y * s, a.y * a.z * k - a.x * s, c + a.z * a.z * k);
}
void main() {
  float seed = v_spin.w * 50.0;
  mat3 rot = axisAngle(v_spin.xyz + 0.01, v_angle);
  float ang = atan(v_c.y, v_c.x);
  vec3 ring = rot * vec3(cos(ang), sin(ang), 0.0);
  float edge = 0.78 + 0.16 * gnoise(ring * 1.3 + seed) + 0.06 * gnoise(ring * 3.5 + seed);
  float r = length(v_c) / edge;
  if (r > 1.0) discard;
  vec3 n = vec3(v_c / edge, sqrt(max(0.0, 1.0 - r * r)));
  vec3 p = rot * n;
  // Gentle relief (large-scale bumps and shallow craters), not noise.
  float e = 0.04;
  float h = fbm3(p * 1.6 + seed, 4);
  vec3 grad = vec3(fbm3((p + vec3(e, 0, 0)) * 1.6 + seed, 4) - h, fbm3((p + vec3(0, e, 0)) * 1.6 + seed, 4) - h, 0.0) / e;
  n = normalize(n - vec3(grad.xy * 0.07, 0.0));
  float albedo = 0.16 + 0.03 * gnoise(p * 3.0 + seed) + 0.04 * (fract(seed) - 0.5);
  float diff = max(dot(n, u_sunView), 0.0);
  float limb = pow(1.0 - n.z, 3.0);
  vec3 col = vec3(albedo) * vec3(1.0, 0.95, 0.88) * (diff * 2.2 + 0.015) + vec3(0.25, 0.3, 0.4) * limb * diff * 0.08;
  float a = smoothstep(1.0, 0.94, r) * v_fade;
  o = vec4(col * a * u_bright, a * u_vis);
}
`;

// ── Comets: a bright coma with a blue ion tail and a curved, golden dust tail ────────────────────
export const COMET_VS = `${HEADER}
uniform mat4 u_view;
uniform mat4 u_proj;
uniform vec3 u_head;        // camera-relative nucleus
uniform vec3 u_tail;        // tail direction * length
uniform vec3 u_bend;        // where the dust tail curves to
uniform float u_width;
uniform int u_which;        // 0 ion tail, 1 dust tail, 2 coma
out vec2 v_c;
void main() {
  vec2 c = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1));
  v_c = c;
  vec3 headV = (u_view * vec4(u_head, 1.0)).xyz;
  if (u_which == 2) {
    vec2 q = c * 2.0 - 1.0;
    gl_Position = u_proj * vec4(headV + vec3(q * u_width * 3.0, 0.0), 1.0);
    return;
  }
  float s = c.x;
  vec3 along = u_tail * s + (u_which == 1 ? u_bend * s * s : vec3(0.0));
  vec3 pV = (u_view * vec4(u_head + along, 1.0)).xyz;
  vec3 dirV = normalize((u_view * vec4(u_tail + (u_which == 1 ? u_bend * 2.0 * s : vec3(0.0)), 0.0)).xyz);
  vec3 side = normalize(cross(dirV, vec3(0.0, 0.0, 1.0)));
  float w = u_width * (u_which == 1 ? mix(0.6, 5.0, s) : mix(0.4, 1.6, s));
  gl_Position = u_proj * vec4(pV + side * (c.y * 2.0 - 1.0) * w, 1.0);
}
`;

export const COMET_FS = `${HEADER}
${NOISE}
in vec2 v_c;
out vec4 o;
uniform int u_which;
uniform float u_bright;
uniform float u_time;
void main() {
  vec3 col;
  if (u_which == 2) {
    vec2 q = v_c * 2.0 - 1.0;
    float r = length(q);
    col = vec3(0.85, 0.95, 1.0) * (exp(-r * r * 60.0) * 6.0 + exp(-r * 6.0) * 0.5);
  } else {
    float s = v_c.x;
    float across = abs(v_c.y * 2.0 - 1.0);
    float streak = 0.6 + 0.4 * fbm2(vec2(s * 3.0 - u_time * 0.2, v_c.y * 14.0), 4);
    float body = exp(-across * across * 5.0) * pow(1.0 - s, 1.6) * smoothstep(0.0, 0.03, s);
    col = (u_which == 0 ? vec3(0.38, 0.62, 1.0) * 1.1 : vec3(1.0, 0.88, 0.7) * 0.8) * body * streak;
  }
  o = vec4(col * u_bright, 0.0);
}
`;

// ── Bloom and the film finish ─────────────────────────────────────────────────────────────────────
export const BLOOM_DOWN_FS = `${HEADER}
in vec2 v_uv;
out vec4 o;
uniform sampler2D u_src;
uniform vec2 u_texel;
uniform float u_threshold;
void main() {
  vec3 c = texture(u_src, v_uv + u_texel * vec2(-1, -1)).rgb + texture(u_src, v_uv + u_texel * vec2(1, -1)).rgb
         + texture(u_src, v_uv + u_texel * vec2(-1, 1)).rgb + texture(u_src, v_uv + u_texel * vec2(1, 1)).rgb;
  c *= 0.25;
  float l = max(c.r, max(c.g, c.b));
  c *= max(l - u_threshold, 0.0) / max(l, 1e-4);
  o = vec4(c, 1.0);
}
`;

export const BLUR_FS = `${HEADER}
in vec2 v_uv;
out vec4 o;
uniform sampler2D u_src;
uniform vec2 u_dir;
void main() {
  vec3 c = texture(u_src, v_uv).rgb * 0.227;
  c += (texture(u_src, v_uv + u_dir * 1.385).rgb + texture(u_src, v_uv - u_dir * 1.385).rgb) * 0.316;
  c += (texture(u_src, v_uv + u_dir * 3.231).rgb + texture(u_src, v_uv - u_dir * 3.231).rgb) * 0.07;
  o = vec4(c, 1.0);
}
`;

export const FINAL_FS = `${HEADER}
${NOISE}
in vec2 v_uv;
out vec4 o;
uniform sampler2D u_scene;
uniform sampler2D u_bloom;
uniform float u_exposure;
uniform float u_fade;
uniform vec2 u_res;
uniform float u_time;
vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}
void main() {
  vec3 c = texture(u_scene, v_uv).rgb + texture(u_bloom, v_uv).rgb * 0.55;
  c = aces(c * u_exposure);
  c = pow(c, vec3(0.94));
  vec2 q = (v_uv - 0.5) * vec2(u_res.x / u_res.y, 1.0);
  c *= mix(0.78, 1.0, smoothstep(1.1, 0.35, length(q)));
  c += (hash12(gl_FragCoord.xy + fract(u_time * 13.0) * 517.0) - 0.5) * (1.5 / 255.0);
  o = vec4(c * u_fade, 1.0);
}
`;
