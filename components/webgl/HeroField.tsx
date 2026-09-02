"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap, ScrollTrigger, perfTier, dprCap, damp } from "@/lib/motion";

/**
 * The hero's WebGL layer: a receding field of highway light-trails streaming
 * across the photograph, a steel light-sweep and a road glow, all additive.
 * Pointer moves the camera by depth; scrolling the hero out accelerates the
 * field and fades it. Rendered on GSAP's ticker so it shares one clock with
 * every DOM animation; parked when off-screen or hidden; disposed completely
 * on unmount so client-side routing can never leak a GL context.
 *
 * Never mounted under reduced motion or without WebGL — the caller gates it,
 * and the composition beneath is complete without it.
 */

const PARTICLE_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform float uPixelRatio;
  uniform vec2 uPointer;
  attribute float aSeed;
  attribute float aSpeed;
  varying float vAlpha;
  varying float vStretch;
  void main() {
    vec3 p = position;
    float speed = aSpeed * (1.0 + uScroll * 5.0);
    p.x = mod(p.x + uTime * speed * 2.6 + 44.0, 88.0) - 44.0;
    p.y += sin(uTime * 0.35 + aSeed * 6.2831) * 0.28;
    float depth = clamp((p.z + 32.0) / 36.0, 0.0, 1.0);
    p.x += uPointer.x * depth * 1.6;
    p.y += uPointer.y * depth * 1.0;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = (2.4 + depth * 6.0) * uPixelRatio;
    gl_PointSize = size * (34.0 / -mv.z);
    vAlpha = smoothstep(0.0, 0.18, depth) * (0.14 + depth * 0.42);
    vStretch = 1.3 + speed * 1.7 + uScroll * 2.2;
  }
`;

const PARTICLE_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vStretch;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    uv.x /= max(vStretch, 0.5);
    uv.y *= 1.35;
    float d = length(uv);
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    gl_FragColor = vec4(uColor, a * vAlpha * uOpacity);
  }
`;

const SHEEN_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const SHEEN_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform float uOpacity;
  uniform vec2 uPointer;
  varying vec2 vUv;
  void main() {
    vec2 uv = vUv;
    float band = uv.x * 0.85 + uv.y * 0.3 - fract(uTime * 0.04) * 1.7 + 0.35;
    float sweep = exp(-pow((band - 0.5) * 7.5, 2.0)) * 0.085;
    vec2 c = vec2(0.62 + uPointer.x * 0.03, 0.24 + uPointer.y * 0.02);
    float glow = exp(-length((uv - c) * vec2(1.5, 3.4)) * 2.4) * 0.34;
    float horizon = exp(-abs(uv.y - 0.40) * 26.0) * 0.05;
    vec3 col = vec3(0.30, 0.50, 1.0) * (sweep + glow) + vec3(0.62, 0.72, 1.0) * horizon;
    float a = (sweep + glow + horizon) * (1.0 - uScroll * 0.85) * uOpacity;
    gl_FragColor = vec4(col, a);
  }
`;

export function HeroField({ className }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const section = el.closest<HTMLElement>("[data-hero]") ?? el.parentElement!;
    const tier = perfTier();
    if (tier === 0) return;

    const renderer = new THREE.WebGLRenderer({
      antialias: tier >= 3,
      alpha: true,
      powerPreference: "high-performance",
      stencil: false,
      depth: false,
    });
    renderer.setPixelRatio(dprCap(tier >= 3 ? 2 : 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.autoClear = false;
    const canvas = renderer.domElement;
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;";
    el.appendChild(canvas);

    /* ---- particles ---- */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 120);
    camera.position.set(0, 0, 22);

    const count = tier >= 3 ? 1100 : tier === 2 ? 700 : 380;
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const spd = new Float32Array(count);
    let s = 1337;
    const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = rnd() * 88 - 44;
      pos[i * 3 + 1] = (rnd() - 0.5) * 16 - 2.5;
      pos[i * 3 + 2] = -32 + rnd() * 36;
      seed[i] = rnd();
      spd[i] = 0.35 + rnd() * 1.4;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    geo.setAttribute("aSpeed", new THREE.BufferAttribute(spd, 1));
    const pMat = new THREE.ShaderMaterial({
      vertexShader: PARTICLE_VERT,
      fragmentShader: PARTICLE_FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() },
        uPointer: { value: new THREE.Vector2() },
        uColor: { value: new THREE.Color(0.55, 0.7, 1.0) },
        uOpacity: { value: 0 },
      },
    });
    const points = new THREE.Points(geo, pMat);
    scene.add(points);

    /* ---- sheen ---- */
    const sheenScene = new THREE.Scene();
    const sheenCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const sMat = new THREE.ShaderMaterial({
      vertexShader: SHEEN_VERT,
      fragmentShader: SHEEN_FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uOpacity: { value: 0 },
        uPointer: { value: new THREE.Vector2() },
      },
    });
    const sGeo = new THREE.PlaneGeometry(2, 2);
    sheenScene.add(new THREE.Mesh(sGeo, sMat));

    /* ---- state ---- */
    const pointer = new THREE.Vector2();
    const pointerTarget = new THREE.Vector2();
    let scroll = 0;
    let scrollTarget = 0;
    let visible = true;
    let hidden = document.hidden;
    let t = 0;

    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const onPointer = (e: PointerEvent) => {
      pointerTarget.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    const onVis = () => (hidden = document.hidden);
    document.addEventListener("visibilitychange", onVis);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: "80px" });
    io.observe(section);

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom top",
      onUpdate: (self) => (scrollTarget = self.progress),
    });

    const tick = (_time: number, dt: number) => {
      if (!visible || hidden) return;
      const d = Math.min(dt / 1000, 1 / 30);
      t += d;
      const k = damp(5, d);
      pointer.lerp(pointerTarget, k);
      scroll += (scrollTarget - scroll) * damp(7, d);
      camera.position.x = pointer.x * 0.9;
      camera.position.y = pointer.y * 0.5 - scroll * 3;
      camera.position.z = 22 - scroll * 10;
      camera.lookAt(0, -scroll * 2, 0);
      pMat.uniforms.uTime.value = t;
      pMat.uniforms.uScroll.value = scroll;
      pMat.uniforms.uPointer.value.copy(pointer);
      sMat.uniforms.uTime.value = t;
      sMat.uniforms.uScroll.value = scroll;
      sMat.uniforms.uPointer.value.copy(pointer);
      renderer.clear();
      renderer.render(sheenScene, sheenCam);
      renderer.render(scene, camera);
    };
    gsap.ticker.add(tick);

    const intro = gsap.to([pMat.uniforms.uOpacity, sMat.uniforms.uOpacity], {
      value: 1,
      duration: 2.6,
      ease: "power2.out",
      delay: 0.3,
    });

    return () => {
      intro.kill();
      gsap.ticker.remove(tick);
      st.kill();
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVis);
      geo.dispose();
      pMat.dispose();
      sGeo.dispose();
      sMat.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, []);

  return <div ref={host} aria-hidden className={className} />;
}
