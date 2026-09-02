"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, EASE } from "@/lib/motion";

/**
 * Magnetic attraction. The wrapper listens; the child moves. Two quickTo
 * setters mean the pointer handler never allocates a tween. Disabled on
 * coarse pointers and under reduced motion.
 */
export function Magnetic({
  children,
  strength = 0.3,
  radius = 1.35,
  className,
}: {
  children: ReactNode;
  strength?: number;
  radius?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!fine || reduced) return;

      const xTo = gsap.quickTo(el, "x", { duration: 0.7, ease: EASE.settle });
      const yTo = gsap.quickTo(el, "y", { duration: 0.7, ease: EASE.settle });
      let rect = el.getBoundingClientRect();
      let active = false;
      const measure = () => (rect = el.getBoundingClientRect());

      const onMove = (e: PointerEvent) => {
        if (!active) return;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const reach = Math.max(rect.width, rect.height) * radius;
        if (Math.hypot(dx, dy) > reach) {
          xTo(0);
          yTo(0);
          return;
        }
        xTo(dx * strength);
        yTo(dy * strength);
      };
      const onEnter = () => {
        measure();
        active = true;
      };
      const onLeave = () => {
        active = false;
        xTo(0);
        yTo(0);
      };

      el.addEventListener("pointerenter", onEnter);
      el.addEventListener("pointerleave", onLeave);
      window.addEventListener("pointermove", onMove, { passive: true });
      return () => {
        el.removeEventListener("pointerenter", onEnter);
        el.removeEventListener("pointerleave", onLeave);
        window.removeEventListener("pointermove", onMove);
      };
    },
    { scope: ref, dependencies: [strength, radius] },
  );

  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
