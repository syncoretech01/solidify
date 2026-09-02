"use client";

import { useRef, type ElementType, type ReactNode, type Ref } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, SplitText, ScrollTrigger, EASE, DUR, STAGGER, REVEAL_START } from "@/lib/motion";

type PolymorphicTag = (props: {
  ref?: Ref<HTMLElement>;
  className?: string;
  id?: string;
  "data-reveal"?: string;
  children?: ReactNode;
  style?: React.CSSProperties;
}) => ReactNode;

type Mode = "lines" | "words" | "chars";

/**
 * The site's single text-reveal primitive. Everything is masked at the line
 * box, so glyphs slide out from behind a hard edge rather than fading in.
 * SplitText instances are always reverted on cleanup.
 */
export function RevealText({
  children,
  as: Tag = "div",
  className = "",
  mode = "lines",
  delay = 0,
  immediate = false,
  from = 118,
  duration = DUR.section,
  stagger,
  start = REVEAL_START,
  id,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  mode?: Mode;
  delay?: number;
  immediate?: boolean;
  from?: number;
  duration?: number;
  stagger?: number;
  start?: string;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(el, { opacity: 1 });
        return;
      }

      let split: SplitText | null = null;
      let tween: gsap.core.Tween | null = null;
      let trigger: ScrollTrigger | null = null;

      const build = (self: SplitText) => {
        const targets = mode === "lines" ? self.lines : mode === "words" ? self.words : self.chars;
        if (!targets.length) return;
        gsap.set(el, { opacity: 1 });
        gsap.set(targets, { yPercent: from });
        const stag = stagger ?? (mode === "lines" ? STAGGER.line : mode === "words" ? STAGGER.word : 0.016);
        tween = gsap.to(targets, {
          yPercent: 0,
          duration,
          delay,
          ease: EASE.veil,
          stagger: stag,
          paused: !immediate,
        });
        if (!immediate) {
          trigger = ScrollTrigger.create({ trigger: el, start, once: true, onEnter: () => tween?.play() });
        }
        return tween;
      };

      const run = () => {
        split = new SplitText(el, {
          type: mode === "lines" ? "lines" : mode === "words" ? "lines,words" : "lines,words,chars",
          mask: "lines",
          linesClass: "split-line",
          autoSplit: true,
          onSplit: build,
        });
      };

      // Splitting before the webfont swaps in produces wrong line breaks.
      if (document.fonts?.status === "loaded") run();
      else document.fonts?.ready.then(run).catch(run);

      return () => {
        trigger?.kill();
        tween?.kill();
        split?.revert();
      };
    },
    { scope: ref, dependencies: [mode, immediate, delay] },
  );

  const Rendered = Tag as unknown as PolymorphicTag;
  return (
    <Rendered ref={ref} id={id} className={className} data-reveal="">
      {children}
    </Rendered>
  );
}

/** Block-level reveal for anything that is not type. */
export function Reveal({
  children,
  as: Tag = "div",
  className = "",
  delay = 0,
  y = 28,
  stagger,
  start = REVEAL_START,
  staggerChildren = false,
  immediate = false,
  style,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
  y?: number;
  stagger?: number;
  start?: string;
  staggerChildren?: boolean;
  immediate?: boolean;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(el, { opacity: 1 });
        return;
      }
      const targets = staggerChildren ? Array.from(el.children) : el;
      if (staggerChildren) gsap.set(el, { opacity: 1 });
      gsap.set(targets, { opacity: 0, y });
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration: DUR.base,
        delay,
        ease: EASE.out,
        stagger: stagger ?? (staggerChildren ? STAGGER.base : 0),
        ...(immediate ? {} : { scrollTrigger: { trigger: el, start, once: true } }),
      });
    },
    { scope: ref, dependencies: [staggerChildren, immediate] },
  );

  const Rendered = Tag as unknown as PolymorphicTag;
  return (
    <Rendered ref={ref} className={className} data-reveal="" style={style}>
      {children}
    </Rendered>
  );
}
