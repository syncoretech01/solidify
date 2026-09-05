/**
 * SOLIDIFY — the shared WebGL runtime.
 *
 * Every ambient shader surface on the site is a single fullscreen triangle with
 * one fragment program. That is all they are, so they do not need three.js:
 * this file is the whole renderer in ~150 lines and adds about 4 KB to a route
 * instead of ~150 KB. `components/webgl/HeroScene.tsx` keeps three because it
 * is a genuinely different thing — a textured, masked, depth-parallaxed scene
 * with an intro timeline.
 *
 * What every surface gets for free, because getting one of them wrong is how a
 * background ends up eating a laptop battery:
 *
 *   • DPR capped by device tier, and capped again by a per-surface ceiling —
 *     an ambient field never needs the pixels a hero does.
 *   • Painting ONLY when the host is on screen and the tab is visible.
 *   • One GSAP-ticker subscription, so it shares the frame with Lenis and
 *     ScrollTrigger rather than racing them in its own rAF.
 *   • A frame budget: a surface that cannot hold its rate steps its buffer
 *     down, twice, and then stops stepping. It never deletes itself — a
 *     background that vanishes for good after one bad scroll is worse than a
 *     slightly softer one.
 *   • Complete teardown, including `loseContext` — contexts are a scarce
 *     browser resource and route changes are frequent here.
 *
 * Callers never touch GL. They hand over a fragment shader and a uniform
 * declaration; `set()` writes values, `dispose()` removes every trace.
 */

import { gsap, dprCap, perfTier } from "@/lib/motion";

/** A fullscreen triangle. Cheaper than a quad and has no diagonal seam. */
const VERT = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

export type UniformValue = number | readonly number[];

export type SurfaceOptions = {
  /** GLSL ES 3.00 fragment source. Receives `vUv`, must write `outColor`. */
  frag: string;
  /** Initial uniform values. The set of keys is fixed after creation. */
  uniforms: Record<string, UniformValue>;
  /** Ceiling on device pixel ratio for this surface. Ambient fields want 1–1.25. */
  maxDpr?: number;
  /** Called every painted frame: (elapsedSeconds, deltaSeconds). */
  onFrame?: (t: number, dt: number) => void;
  /** Margin for the visibility observer. */
  rootMargin?: string;
};

export type Surface = {
  set: (name: string, value: UniformValue) => void;
  dispose: () => void;
};

/**
 * Create a surface inside `host`. Returns null when WebGL2 is unavailable or
 * the device tier is 0 — the caller's static fallback then stands alone.
 */
export function createSurface(host: HTMLElement, opts: SurfaceOptions): Surface | null {
  const tier = perfTier();
  if (tier === 0) return null;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;";

  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    powerPreference: tier >= 3 ? "high-performance" : "low-power",
    failIfMajorPerformanceCaveat: true,
  });
  if (!gl) return null;

  const compile = (type: number, src: string) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      if (process.env.NODE_ENV !== "production") console.warn(gl.getShaderInfoLog(sh));
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  };

  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, opts.frag);
  if (!vs || !fs) return null;

  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    if (process.env.NODE_ENV !== "production") console.warn(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.useProgram(program);

  /* Uniform locations are resolved once; unknown names are silently ignored so
     a shader can drop a uniform without the caller having to know. */
  const locs = new Map<string, WebGLUniformLocation | null>();
  const values = new Map<string, UniformValue>();
  for (const key of Object.keys(opts.uniforms)) {
    locs.set(key, gl.getUniformLocation(program, key));
    values.set(key, opts.uniforms[key]);
  }

  const upload = (name: string, v: UniformValue) => {
    const loc = locs.get(name);
    if (!loc) return;
    if (typeof v === "number") gl.uniform1f(loc, v);
    else if (v.length === 2) gl.uniform2f(loc, v[0], v[1]);
    else if (v.length === 3) gl.uniform3f(loc, v[0], v[1], v[2]);
    else if (v.length === 4) gl.uniform4f(loc, v[0], v[1], v[2], v[3]);
  };

  /* ---- sizing ---------------------------------------------------------- */

  const ceiling = opts.maxDpr ?? 1.25;
  let quality = 1;
  let w = 1;
  let h = 1;

  const resize = () => {
    const rect = host.getBoundingClientRect();
    const cw = Math.max(1, Math.round(rect.width));
    const ch = Math.max(1, Math.round(rect.height));
    const dpr = dprCap(tier >= 3 ? ceiling : Math.min(ceiling, 1)) * quality;
    const nw = Math.max(1, Math.round(cw * dpr));
    const nh = Math.max(1, Math.round(ch * dpr));
    if (nw === w && nh === h) return;
    w = nw;
    h = nh;
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
    upload("uRes", [w, h]);
  };

  host.appendChild(canvas);
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  /* ---- when to paint --------------------------------------------------- */

  let onScreen = false;
  let hidden = document.hidden;
  let lost = false;

  const io = new IntersectionObserver(([e]) => (onScreen = e.isIntersecting), {
    rootMargin: opts.rootMargin ?? "120px",
  });
  io.observe(host);

  const onVis = () => (hidden = document.hidden);
  document.addEventListener("visibilitychange", onVis);

  const onLost = (e: Event) => {
    e.preventDefault();
    lost = true;
  };
  canvas.addEventListener("webglcontextlost", onLost);

  /* ---- the frame budget ------------------------------------------------ */

  /** Consecutive bad frames before the buffer is stepped down. ~7s at 20fps. */
  const STEP_AFTER = 150;

  let elapsed = 0;
  let slow = 0;
  let stepped = 0;
  let dead = false;

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  /* Premultiplied source-over. A surface computes LIGHT and reports how much
     of it there is as alpha, so the section shows through wherever the shader
     is dark. Getting this wrong is not subtle: an earlier version wrote
     alpha 1.0, which made every ambient canvas an opaque black rectangle over
     its own section. */
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  for (const [k, v] of values) upload(k, v);

  const tick = (_time: number, delta: number) => {
    if (dead || lost || !onScreen || hidden) return;
    const dt = Math.min(delta / 1000, 1 / 24);
    elapsed += dt;

    /* Resolution steps down under sustained load, twice, and then stops
       stepping. It never removes itself.

       The first version treated 90 frames slower than 34ms as fatal and set
       display:none for good. Three seconds of jank — a heavy scroll, a
       throttled tab waking up, a software renderer — permanently deleted the
       background, and it never came back. Now: only genuinely bad frames
       count, they have to be sustained for far longer, recovery is twice as
       fast as accumulation, and the floor is a smaller buffer rather than
       nothing at all. */
    if (delta > 45) {
      if (++slow > STEP_AFTER && stepped < 2) {
        stepped += 1;
        slow = 0;
        quality = stepped === 1 ? 0.7 : 0.5;
        w = h = -1;
        resize();
      }
    } else if (slow > 0) {
      slow -= 2;
    }

    opts.onFrame?.(elapsed, dt);
    upload("uTime", elapsed);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  gsap.ticker.add(tick);

  return {
    set(name, value) {
      if (dead || !locs.has(name)) return;
      values.set(name, value);
      upload(name, value);
    },
    dispose() {
      dead = true;
      gsap.ticker.remove(tick);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    },
  };
}

/**
 * GLSL every surface shares.
 *
 * Because the blend is additive, a fragment program here computes LIGHT, not
 * colour: the section's own surface is the ground, and whatever these return
 * is added on top of it. There is no base colour to mix into and no vignette
 * that darkens - `falloff` attenuates the light toward the frame edge instead.
 */
export const GLSL_COMMON = `
precision highp float;

/* Well-distributed enough that value noise built on it does not show its
   grid. The previous two-multiply hash left axis-aligned blocks visible in
   the haze on a wide dark screen. */
float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
}

/* Each octave is rotated as well as scaled, so successive octaves cannot
   stack their grids on the same axes. */
const mat2 FBM_ROT = mat2(0.80, 0.60, -0.60, 0.80);

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = FBM_ROT * p * 2.03 + 17.1;
    a *= 0.5;
  }
  return v;
}

/* The house palette, as light. Blue behaves like light here, never paint. */
const vec3 PETROL = vec3(0.075, 0.165, 0.290);
const vec3 STEEL  = vec3(0.267, 0.294, 0.345);
const vec3 GLOW   = vec3(0.310, 0.588, 1.000);
const vec3 ICE    = vec3(0.760, 0.870, 1.000);

/* Light falls off toward the frame edge so a surface never ends on a hard
   line against the section it sits in. */
float falloff(vec2 uv) {
  return smoothstep(1.30, 0.28, length((uv - 0.5) * vec2(1.06, 1.0)));
}

/* One comet: bright head, exponential tail, soft across its own row. */
float trail(vec2 p, float rows, float speed, float len, float thick, float t, float seed) {
  float row = floor(p.y * rows + seed);
  float ry = fract(p.y * rows + seed) - 0.5;
  float r1 = hash21(vec2(row, seed + 3.1));
  float r2 = hash21(vec2(row, seed + 11.7));
  if (r1 < 0.34) return 0.0;
  float x = fract(p.x * 0.42 - t * speed * (0.55 + r1) + r2);
  float tail = exp(-x / len);
  float head = exp(-x * x * 1400.0) * 1.6;
  float core = exp(-ry * ry * thick);
  return (tail + head) * core;
}
`;
