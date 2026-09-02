"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, EASE } from "@/lib/motion";

/**
 * The house cursor: a hairline ring with its own inertia plus a dot locked to
 * the true position. Elements opt into states with
 * `data-cursor="view" | "drag" | "link" | "hide"` and `data-cursor-label`.
 * Also writes --mx / --my (0–1) on <html> so stylesheets can react to the
 * pointer without JS touching paint. Fine pointers only, never under reduced
 * motion.
 */
export function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(fine && !reduced);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const ringEl = ring.current;
    const dotEl = dot.current;
    const labelEl = label.current;
    if (!ringEl || !dotEl || !labelEl) return;

    gsap.set([ringEl, dotEl], { xPercent: -50, yPercent: -50, opacity: 0 });
    const rx = gsap.quickTo(ringEl, "x", { duration: 0.5, ease: "power3.out" });
    const ry = gsap.quickTo(ringEl, "y", { duration: 0.5, ease: "power3.out" });
    const dx = gsap.quickTo(dotEl, "x", { duration: 0.1, ease: "power2.out" });
    const dy = gsap.quickTo(dotEl, "y", { duration: 0.1, ease: "power2.out" });
    const root = document.documentElement;

    let shown = false;
    const onMove = (e: PointerEvent) => {
      if (!shown) {
        shown = true;
        gsap.to([ringEl, dotEl], { opacity: 1, duration: 0.4 });
      }
      rx(e.clientX);
      ry(e.clientY);
      dx(e.clientX);
      dy(e.clientY);
      root.style.setProperty("--mx", (e.clientX / window.innerWidth).toFixed(4));
      root.style.setProperty("--my", (e.clientY / window.innerHeight).toFixed(4));
    };
    const onLeave = () => {
      shown = false;
      gsap.to([ringEl, dotEl], { opacity: 0, duration: 0.3 });
    };

    const setState = (state: string | null, text: string) => {
      const big = state === "view" || state === "drag";
      gsap.to(ringEl, {
        width: big ? 88 : state === "link" ? 48 : 32,
        height: big ? 88 : state === "link" ? 48 : 32,
        borderColor: state ? "rgba(91,140,255,0.9)" : "rgba(255,255,255,0.55)",
        backgroundColor: big ? "rgba(47,107,255,0.14)" : "rgba(0,0,0,0)",
        opacity: state === "hide" ? 0 : 1,
        duration: 0.45,
        ease: EASE.out,
      });
      gsap.to(dotEl, {
        scale: big ? 0 : state === "link" ? 0.5 : 1,
        opacity: state === "hide" ? 0 : 1,
        duration: 0.35,
        ease: EASE.out,
      });
      labelEl.textContent = text;
      gsap.to(labelEl, { opacity: text ? 1 : 0, duration: 0.3 });
    };

    const onOver = (e: Event) => {
      const t = (e.target as Element)?.closest?.("[data-cursor]");
      if (t) {
        setState(t.getAttribute("data-cursor"), t.getAttribute("data-cursor-label") ?? "");
        return;
      }
      const link = (e.target as Element)?.closest?.("a, button, [role='button'], input, select, textarea, summary, label");
      setState(link ? "link" : null, "");
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div aria-hidden className="pointer-events-none hidden lg:block">
      <div
        ref={ring}
        className="fixed left-0 top-0 z-[120] flex h-8 w-8 items-center justify-center rounded-full border border-white/55 will-change-transform mix-blend-difference"
      >
        <span ref={label} className="label whitespace-nowrap text-[0.6rem] text-white opacity-0" />
      </div>
      <div ref={dot} className="fixed left-0 top-0 z-[120] h-[5px] w-[5px] rounded-full bg-white will-change-transform mix-blend-difference" />
    </div>
  );
}
