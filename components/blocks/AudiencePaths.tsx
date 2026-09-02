"use client";

import Link from "next/link";
import { useRef } from "react";
import { Plate } from "@/components/ui/Plate";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHead, Index } from "@/components/ui/Primitives";
import type { MediaId } from "@/lib/media";

type Item = { slot: MediaId; title: string; kicker: string; text: string; href: string; cta: string };

/** Three audience cards with photographic heads, hover depth and a sheen that follows the pointer. */
export function AudiencePaths({ eyebrow, title, items, id = "paths" }: { eyebrow: string; title: string; items: readonly Item[]; id?: string }) {
  return (
    <Section surface="navy" id={id} ariaLabelledBy={`${id}-title`}>
      <div className="shell flex flex-col gap-12">
        <SectionHead eyebrow={eyebrow} title={title} id={`${id}-title`} />
        <Reveal staggerChildren className="grid gap-5 md:grid-cols-3">
          {items.map((it, i) => (
            <PathCard key={it.href} item={it} index={i + 1} />
          ))}
        </Reveal>
      </div>
    </Section>
  );
}

function PathCard({ item, index }: { item: Item; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
  };
  return (
    <Link
      ref={ref}
      href={item.href}
      onPointerMove={onMove}
      data-cursor="view"
      data-cursor-label="Open"
      className="group card steel-edge sheen flex flex-col overflow-hidden transition-transform duration-500 [transition-timing-function:var(--ease-arrive)] hover:-translate-y-1.5 focus-visible:-translate-y-1.5"
    >
      <Plate slot={item.slot} sizes="(max-width: 768px) 100vw, 33vw" parallax={6} scrim="bottom" className="aspect-[16/11]" radius="0" />
      <div className="flex flex-1 flex-col gap-4 p-6 lg:p-7">
        <div className="flex items-center justify-between">
          <Index n={index} />
          <span className="label">{item.kicker}</span>
        </div>
        <h3 className="title">{item.title}</h3>
        <p className="body">{item.text}</p>
        <span className="mt-auto inline-flex items-center gap-2 pt-3 text-[var(--step--1)] font-semibold text-[var(--text-hi)]">
          {item.cta}
          <svg className="btn-arrow" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
