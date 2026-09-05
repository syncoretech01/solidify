"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";
import { gsap, ScrollTrigger, prefersReducedMotion, damp } from "@/lib/motion";
import { createSurface, GLSL_COMMON, type Surface } from "@/lib/webgl/surface";

/**
 * The ambient light surfaces.
 *
 * Three presets, each a single fragment program over the whole section. They
 * are atmosphere, never subject: nothing in them depicts a truck, a road sign
 * or a piece of equipment, because a drawn approximation of the work is
 * exactly what this site removed. What they add is depth, motion and light
 * behind photography and type — the thing a flat plate cannot give you.
 *
 *   transit  — layered light moving past at three depths, with a specular
 *              sheen that tracks the pointer. Used behind page heroes.
 *   network  — a lit node field with traces running between the nodes, driven
 *              by scroll. Used behind the OEM movement board.
 *   dusk     — slow volumetric bands and one soft horizon glow. Used behind
 *              quiet editorial sections and the closing scene.
 *
 * Contract, enforced by QA: at most ONE Field per route, and never on a route
 * that already carries the hero scene. Under reduced motion nothing mounts at
 * all and the CSS ground beneath is the finished state.
 */

export type FieldPreset = "transit" | "network" | "dusk";

const HEAD = `#version 300 es
${GLSL_COMMON}
uniform vec2  uRes;
uniform vec2  uPointer;
uniform float uTime;
uniform float uScroll;
uniform float uIntensity;
in  vec2 vUv;
out vec4 outColor;
`;

/* ── transit ────────────────────────────────────────────────────────────────
   Three depths of light travelling across the frame: a bright head with an
   exponential tail, soft across its own lane. Far lanes are slow, tight and
   dim; the near lane is fast, wide and cool. Over that, one broad sheen that
   leans toward the pointer, and a low lift so the foot of the frame never
   ends flat. Everything here is ADDED to the section beneath.              */
const TRANSIT = `${HEAD}
void main() {
  vec2 uv = vUv;
  float asp = max(uRes.x, 1.0) / max(uRes.y, 1.0);
  vec2 p = vec2(uv.x * asp, uv.y);
  vec2 par = uPointer * 0.045;

  float t = uTime + uScroll * 6.0;

  float far  = trail(p + par * 0.20, 9.0, 0.055, 0.16, 900.0, t, 2.0);
  float mid  = trail(p + par * 0.55, 5.0, 0.095, 0.26, 320.0, t, 17.0);
  float near = trail(p + par * 1.00, 2.6, 0.150, 0.40, 110.0, t, 41.0);

  vec3 light = vec3(0.0);
  light += GLOW * far  * 0.16;
  light += GLOW * mid  * 0.26;
  light += mix(GLOW, ICE, 0.55) * near * 0.20;

  /* atmosphere: slow drifting haze, just enough to stop the trails reading as
     stripes on a flat ground */
  vec2 hz = p * 1.35 + vec2(uTime * 0.013, -uTime * 0.007) + par * 0.4;
  float haze = fbm(hz) * 0.7 + fbm(hz * 2.4 - 4.0) * 0.3;
  light += PETROL * pow(haze, 1.6) * 0.55;

  /* the sheen: a wide soft lift that follows the pointer */
  vec2 sp = vec2(0.5 + uPointer.x * 0.40, 0.56 + uPointer.y * 0.28);
  float sheen = exp(-pow(length((uv - sp) * vec2(asp * 0.50, 1.0)) * 1.7, 2.0));
  light += mix(PETROL, ICE, 0.30) * sheen * 0.30;

  /* horizon lift along the foot */
  light += PETROL * pow(smoothstep(0.62, 0.0, uv.y), 1.8) * 0.55;

  light *= falloff(uv) * uIntensity;
  /* Coverage: how much light is actually here. Zero light, zero alpha, and the
     section beneath is untouched. */
  float a = clamp(max(light.r, max(light.g, light.b)) * 1.9, 0.0, 1.0);
  outColor = vec4(light, a);
}
`;

/* ── network ────────────────────────────────────────────────────────────────
   A field of lit nodes with pulses running between them. Each fragment reads
   its own cell AND the eight around it, so a node's halo crosses cell edges —
   the first version sampled one cell only and the halos clipped into visible
   squares.                                                                  */
const NETWORK = `${HEAD}
void main() {
  vec2 uv = vUv;
  float asp = max(uRes.x, 1.0) / max(uRes.y, 1.0);

  vec2 g = vec2(uv.x * asp, uv.y) * 3.4;
  g += uPointer * vec2(0.16, 0.09);
  g.x += uTime * 0.035 + uScroll * 1.4;

  vec2 cell = floor(g);
  vec2 f = fract(g);

  float nodes = 0.0;
  float pulses = 0.0;

  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 o = vec2(float(i), float(j));
      vec2 c = cell + o;
      float rnd = hash21(c);
      if (rnd < 0.62) continue;

      vec2 jit = vec2(hash21(c + 11.0), hash21(c + 27.0)) * 0.7 + 0.15;
      vec2 d = f - o - jit;

      float r = length(d);
      float pulse = 0.62 + 0.38 * sin(uTime * 1.05 + rnd * 34.0);
      nodes += exp(-r * 13.0) * pulse * 0.40;
      nodes += exp(-r * 3.4) * 0.045;

      /* a dash running along the node's own row */
      float lane = exp(-d.y * d.y * 170.0);
      float head = fract(g.x * 0.5 - uTime * (0.16 + uScroll * 0.5) + rnd);
      float dash = smoothstep(0.86, 1.0, head) * smoothstep(1.0, 0.955, head);
      pulses += lane * dash * 1.4;
    }
  }

  vec3 light = vec3(0.0);
  light += GLOW * nodes;
  light += mix(GLOW, ICE, 0.4) * pulses * 0.5;

  /* a shallow gradient so the field has a floor and a ceiling */
  light += PETROL * pow(smoothstep(1.0, 0.15, uv.y), 1.5) * 0.42;
  light += PETROL * fbm(vec2(uv.x * asp, uv.y) * 1.1 + uTime * 0.01) * 0.22;

  light *= falloff(uv) * uIntensity;
  /* Coverage: how much light is actually here. Zero light, zero alpha, and the
     section beneath is untouched. */
  float a = clamp(max(light.r, max(light.g, light.b)) * 1.9, 0.0, 1.0);
  outColor = vec4(light, a);
}
`;

/* ── dusk ───────────────────────────────────────────────────────────────────
   Two large soft light bodies drifting against each other, with slow diagonal
   bands through them. The quietest of the three: it exists so a large dark
   editorial section is not an empty rectangle.                              */
const DUSK = `${HEAD}
void main() {
  vec2 uv = vUv;
  float asp = max(uRes.x, 1.0) / max(uRes.y, 1.0);
  vec2 p = vec2(uv.x * asp, uv.y);
  vec2 par = uPointer * 0.035;

  float t = uTime * 0.045;
  vec2 q = p * vec2(1.0, 1.7) + par;
  float f1 = fbm(q + vec2(t, -t * 0.6));
  float f2 = fbm(q * 1.8 + vec2(-t * 1.3, t * 0.85) + f1 * 0.8);

  vec3 light = vec3(0.0);

  /* the volume */
  light += PETROL * pow(f2, 1.4) * 1.05;

  /* diagonal bands, slow and wide */
  float band = sin((uv.x * asp * 0.9 + uv.y * 1.7 - uTime * 0.055 + f1 * 1.2) * 3.14159) * 0.5 + 0.5;
  light += mix(PETROL, GLOW, 0.32) * pow(band, 4.0) * 0.20;

  /* two glows: one low and warm-cool, one high and small, both leaning with
     the pointer and drifting with scroll */
  vec2 g1 = vec2(0.30 + uPointer.x * 0.16, 0.20 + uPointer.y * 0.10 + uScroll * 0.22);
  vec2 g2 = vec2(0.78 - uPointer.x * 0.10, 0.74 - uScroll * 0.18);
  light += mix(GLOW, ICE, 0.30) * exp(-pow(length((uv - g1) * vec2(asp * 0.40, 1.0)) * 1.9, 2.0)) * 0.34;
  light += GLOW * exp(-pow(length((uv - g2) * vec2(asp * 0.55, 1.0)) * 3.0, 2.0)) * 0.16;

  light += STEEL * pow(smoothstep(1.0, 0.30, uv.y), 2.0) * 0.05;

  light *= falloff(uv) * uIntensity;
  /* Coverage: how much light is actually here. Zero light, zero alpha, and the
     section beneath is untouched. */
  float a = clamp(max(light.r, max(light.g, light.b)) * 1.9, 0.0, 1.0);
  outColor = vec4(light, a);
}
`;

const FRAG: Record<FieldPreset, string> = { transit: TRANSIT, network: NETWORK, dusk: DUSK };

export function Field({
  preset = "transit",
  className,
  intensity = 1,
  /** Track scroll through this section and feed it to the shader. */
  scrub = true,
  maxDpr = 1.1,
  blend = "normal",
}: {
  preset?: FieldPreset;
  className?: string;
  intensity?: number;
  scrub?: boolean;
  maxDpr?: number;
  /**
   * "screen" puts the surface OVER a photograph as light passing across it,
   * rather than behind it where an opaque frame hides it completely. Used by
   * the page heroes, which are full-bleed photographs.
   */
  blend?: "normal" | "screen";
}) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el || prefersReducedMotion()) return;

    const cur = { x: 0, y: 0, s: 0 };
    const target = { x: 0, y: 0, s: 0 };

    let surface: Surface | null = null;
    try {
      surface = createSurface(el, {
        frag: FRAG[preset],
        uniforms: { uRes: [1, 1], uTime: 0, uPointer: [0, 0], uScroll: 0, uIntensity: intensity },
        maxDpr,
        onFrame: (_t, dt) => {
          const k = damp(3.2, dt);
          cur.x += (target.x - cur.x) * k;
          cur.y += (target.y - cur.y) * k;
          cur.s += (target.s - cur.s) * damp(5, dt);
          surface?.set("uPointer", [cur.x, cur.y]);
          surface?.set("uScroll", cur.s);
        },
      });
    } catch {
      surface = null;
    }
    if (!surface) return;

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const onPointer = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / Math.max(r.width, 1)) * 2 - 1;
      target.y = -(((e.clientY - r.top) / Math.max(r.height, 1)) * 2 - 1);
    };
    if (fine) window.addEventListener("pointermove", onPointer, { passive: true });

    let st: ScrollTrigger | null = null;
    if (scrub) {
      st = ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        invalidateOnRefresh: true,
        onUpdate: (self) => (target.s = self.progress),
      });
    }

    return () => {
      if (fine) window.removeEventListener("pointermove", onPointer);
      st?.kill();
      gsap.killTweensOf(cur);
      surface.dispose();
    };
  }, [preset, intensity, scrub, maxDpr]);

  return (
    <div
      ref={host}
      aria-hidden
      data-gl-field={preset}
      className={clsx("pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={blend === "screen" ? { mixBlendMode: "screen" } : undefined}
    />
  );
}
