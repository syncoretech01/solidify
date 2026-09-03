"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import clsx from "clsx";
import { gsap, ScrollTrigger, EASE } from "@/lib/motion";

/**
 * A soft band of light that crosses its parent — the steel sweep of the
 * detail layer. `hover` runs on the parent's pointerenter, `inview` once when
 * scrolled into view, `auto` on a slow loop. Never under reduced motion.
 */
export function LightSweep({ trigger = "hover", className, delay = 0 }: { trigger?: "hover" | "inview" | "auto"; className?: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const run = () => gsap.fromTo(el, { xPercent: -120 }, { xPercent: 120, duration: 1.1, ease: EASE.out, overwrite: true });
      if (trigger === "hover") {
        const parent = el.parentElement;
        if (!parent) return;
        const on = () => run();
        parent.addEventListener("pointerenter", on);
        parent.addEventListener("focusin", on);
        return () => {
          parent.removeEventListener("pointerenter", on);
          parent.removeEventListener("focusin", on);
        };
      }
      if (trigger === "inview") {
        const st = ScrollTrigger.create({ trigger: el.parentElement ?? el, start: "top 78%", once: true, onEnter: () => gsap.delayedCall(delay, run) });
        return () => st.kill();
      }
      const loop = gsap.timeline({ repeat: -1, repeatDelay: 6.5, delay: 1.5 + delay });
      loop.fromTo(el, { xPercent: -120 }, { xPercent: 120, duration: 1.4, ease: EASE.out });
      return () => {
        loop.kill();
      };
    },
    { scope: ref, dependencies: [trigger] },
  );

  return <span ref={ref} aria-hidden className={clsx("sweep-layer", className)} />;
}
