"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import clsx from "clsx";
import { gsap, ScrollTrigger, EASE, MQ } from "@/lib/motion";
import { BLUEPRINT_PATHS, BLUEPRINT_CALLOUTS, BLUEPRINT_VIEWS, BLUEPRINT_ORDER, type BlueprintViewKey, type BlueprintHighlight } from "@/lib/blueprint";

/**
 * The Blueprint: one technical elevation of a loaded auto hauler, drawn as
 * hairline strokes and cropped into views. `draw` animates the strokes on
 * (DrawSVG) in machine → load → marks order when the drawing scrolls into
 * view (or immediately); under reduced motion the finished drawing is set
 * at once. Highlighted vehicles/groups take the light stroke.
 */
export function Blueprint({
  view = "full",
  draw = true,
  immediate = false,
  highlight,
  callouts,
  className,
  title,
}: {
  view?: BlueprintViewKey;
  draw?: boolean;
  immediate?: boolean;
  highlight?: BlueprintHighlight;
  callouts?: boolean;
  className?: string;
  title?: string;
}) {
  const root = useRef<SVGSVGElement>(null);
  const def = BLUEPRINT_VIEWS[view];
  const showCallouts = callouts ?? def.callouts;
  const hl = highlight ?? def.highlight;
  const hide = new Set(def.hide ?? []);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const strokes = el.querySelectorAll<SVGPathElement>("[data-bp]");
      const texts = el.querySelectorAll<SVGElement>("[data-bp-callout]");
      const reduced = window.matchMedia(MQ.reduced).matches;
      if (!draw || reduced) {
        gsap.set(strokes, { drawSVG: "100%", opacity: 1 });
        gsap.set(texts, { opacity: 1 });
        return;
      }
      gsap.set(strokes, { drawSVG: "0%" });
      gsap.set(texts, { opacity: 0 });
      const tl = gsap.timeline({ paused: true });
      let at = 0;
      for (const g of BLUEPRINT_ORDER) {
        const group = Array.from(strokes).filter((p) => p.dataset.bp === g);
        if (!group.length) continue;
        tl.to(group, { drawSVG: "100%", duration: g === "vehicle" ? 1.1 : 0.7, ease: EASE.inOut, stagger: { each: g === "vehicle" ? 0.03 : 0.05 } }, at);
        at += g === "vehicle" ? 0.45 : 0.22;
      }
      if (texts.length) tl.to(texts, { opacity: 1, duration: 0.6, stagger: 0.12, ease: EASE.out }, at + 0.2);
      if (immediate) {
        tl.play();
        return () => {
          tl.kill();
        };
      }
      const st = ScrollTrigger.create({ trigger: el, start: "top 82%", once: true, onEnter: () => tl.play() });
      return () => {
        st.kill();
        tl.kill();
      };
    },
    { scope: root, dependencies: [view, draw, immediate] },
  );

  const isHot = (p: (typeof BLUEPRINT_PATHS)[number]) => {
    if (!hl) return false;
    if (p.vehicle && hl.vehicles?.includes(p.vehicle)) return true;
    if (hl.groups?.includes(p.group)) return true;
    if (p.id === "pin" && hl.groups?.includes("pin")) return true;
    return false;
  };

  return (
    <svg
      ref={root}
      viewBox={def.viewBox}
      preserveAspectRatio="xMidYMid meet"
      className={clsx("block w-full", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      data-blueprint={view}
      fill="none"
    >
      {title && <title>{title}</title>}
      <g stroke="var(--bp-stroke, #c8cfd8)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke">
        {BLUEPRINT_PATHS.filter((p) => !hide.has(p.group) && (p.id !== "pin" || def.showPin) && (view === "iconRows" ? (p.vehicle ?? 0) >= 9 || p.id === "ground-ext" : (p.vehicle ?? 0) < 9 && p.id !== "ground-ext")).map((p) => {
          const hot = isHot(p);
          return (
            <path
              key={p.id}
              data-bp={p.group}
              d={p.d}
              vectorEffect="non-scaling-stroke"
              stroke={hot ? "var(--bp-highlight, #b3d4ff)" : undefined}
              strokeWidth={hot ? 1.9 : p.group === "tick" || p.group === "structure" ? 0.9 : undefined}
              strokeDasharray={p.group === "tick" ? "3 5" : undefined}
              opacity={p.group === "structure" ? 0.7 : p.group === "tick" ? 0.7 : 1}
              fill={p.fill ? (hot ? "rgba(179,212,255,0.08)" : "rgba(255,255,255,0.035)") : "none"}
            />
          );
        })}
      </g>
      {showCallouts &&
        BLUEPRINT_CALLOUTS.map((c) => (
          <g key={c.id} data-bp-callout>
            <path d={c.leader} stroke="var(--bp-text, #8b95a4)" strokeWidth="0.9" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
            <text x={c.x} y={c.y} textAnchor={c.anchor} fontFamily="var(--font-mono), ui-monospace, monospace" fontSize="13" letterSpacing="1.8" fill="var(--bp-text, #8b95a4)">
              {c.text}
            </text>
          </g>
        ))}
    </svg>
  );
}
