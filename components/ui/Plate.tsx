"use client";

import { useRef, type ReactNode } from "react";
import clsx from "clsx";
import { useGSAP } from "@gsap/react";
import { gsap, EASE, DUR } from "@/lib/motion";
import { media, type MediaId } from "@/lib/media";

export type Grade = "none" | "cool" | "deep" | "warm";

type Props = {
  slot: MediaId;
  /** REQUIRED. What width the image renders at per breakpoint. */
  sizes: string;
  /** Hero plate only. Everything else lazy-loads. */
  priority?: boolean;
  className?: string;
  /** Vertical parallax travel, percent of frame height. 0 disables. */
  parallax?: number;
  /** Curtain reveal on entry. */
  reveal?: boolean;
  /** Extra scale so parallax never exposes an edge. */
  overscan?: number;
  /** Override the slot's reserved aspect (e.g. a full-bleed hero). */
  aspect?: number | "fill";
  scrim?: "bottom" | "left" | "left-soft" | "top" | "full" | "none";
  children?: ReactNode;
  radius?: string;
  cursor?: string;
  cursorLabel?: string;
  /** Extra dim for plates behind type. */
  dim?: number;
  /** Per-slot photographic grade. */
  grade?: Grade;
};

/**
 * The only way a photograph reaches the page.
 *
 * Resolves a slot from the media registry, emits a <picture> with the
 * AVIF/WebP/JPEG ladder and the REAL measured intrinsic width/height from the
 * manifest, and applies the photograph's measured focal point. A public slot
 * with no photograph is a build error — nothing reserved ever ships.
 */
export function Plate({
  slot,
  sizes,
  priority = false,
  className,
  parallax = 10,
  reveal = true,
  overscan = 1.14,
  aspect,
  scrim = "none",
  children,
  radius,
  cursor,
  cursorLabel,
  dim,
  grade = "cool",
}: Props) {
  const frame = useRef<HTMLDivElement>(null);
  const m = media(slot);
  if (!m.photo || !m.manifest) {
    throw new Error(`Plate: slot "${slot}" has no vetted photograph. Feed it a photo in lib/media.ts or recompose the section without one.`);
  }
  const ratio = aspect === "fill" ? undefined : (aspect ?? m.aspect);

  useGSAP(
    () => {
      const el = frame.current;
      if (!el) return;
      const img = el.querySelector<HTMLElement>("[data-plate-img]");
      const veil = el.querySelector<HTMLElement>("[data-plate-veil]");
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        if (veil) gsap.set(veil, { autoAlpha: 0 });
        if (img) gsap.set(img, { scale: 1 });
        return;
      }
      const ctx = gsap.context(() => {
        if (veil && reveal) {
          gsap.set(img, { scale: overscan * 1.07 });
          gsap
            .timeline({ scrollTrigger: { trigger: el, start: "top 88%", once: true } })
            .to(veil, { yPercent: -101, duration: DUR.section, ease: EASE.veil })
            .to(img, { scale: overscan, duration: DUR.section + 0.4, ease: EASE.out }, 0);
        }
        if (parallax > 0 && img) {
          gsap.fromTo(
            img,
            { yPercent: -parallax / 2 },
            {
              yPercent: parallax / 2,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        }
      }, el);
      return () => ctx.revert();
    },
    { scope: frame, dependencies: [slot, parallax, reveal] },
  );

  const style: React.CSSProperties = {
    ...(ratio ? { aspectRatio: String(ratio) } : {}),
    ...(radius ? { borderRadius: radius } : {}),
    ...(dim !== undefined ? ({ "--plate-dim": dim } as React.CSSProperties) : {}),
  };

  const overscanStyle: React.CSSProperties = { transform: `scale(${parallax > 0 || reveal ? overscan : 1})` };

  return (
    <div
      ref={frame}
      className={clsx("frame", className)}
      style={style}
      data-cursor={cursor}
      data-cursor-label={cursorLabel}
      data-slot={slot}
      data-photo={m.photo.file}
      data-grade={grade === "none" ? undefined : grade}
    >
      <div data-plate-img className="absolute inset-0 will-change-transform" style={overscanStyle}>
        <Picture
          file={m.photo.file}
          alt={m.photo.alt}
          focal={m.photo.focal}
          widths={m.manifest.widths}
          width={m.manifest.width}
          height={m.manifest.height}
          sizes={sizes}
          priority={priority}
        />
      </div>

      {scrim !== "none" && <div aria-hidden className={clsx("absolute inset-0 z-[1]", `scrim-${scrim}`)} />}

      {reveal && <div aria-hidden data-plate-veil className="absolute inset-0 z-[3] bg-[var(--surface)] will-change-transform" />}

      {children && <div className="absolute inset-0 z-[2]">{children}</div>}
    </div>
  );
}

function Picture({
  file,
  alt,
  focal,
  widths,
  width,
  height,
  sizes,
  priority,
}: {
  file: string;
  alt: string;
  focal: [number, number];
  widths: number[];
  width: number;
  height: number;
  sizes: string;
  priority: boolean;
}) {
  const set = (ext: string) => widths.map((w) => `/media/gen/${file}-${w}.${ext} ${w}w`).join(", ");
  const fallbackW = widths.find((w) => w >= 1280) ?? widths[widths.length - 1];
  return (
    <picture>
      <source type="image/avif" srcSet={set("avif")} sizes={sizes} />
      <source type="image/webp" srcSet={set("webp")} sizes={sizes} />
      <img
        src={`/media/gen/${file}-${fallbackW}.jpg`}
        srcSet={set("jpg")}
        sizes={sizes}
        width={width}
        height={height}
        alt={alt}
        data-plate={file}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        style={{ objectPosition: `${focal[0]}% ${focal[1]}%` }}
      />
    </picture>
  );
}
