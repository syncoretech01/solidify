"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Plate } from "@/components/ui/Plate";
import { Button } from "@/components/ui/Button";
import { RevealText, Reveal } from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/ui/Primitives";
import { HOME } from "@/lib/content/home";
import { supportsWebGL } from "@/lib/motion";

const HeroField = dynamic(() => import("@/components/webgl/HeroField").then((m) => m.HeroField), { ssr: false });

/**
 * The homepage hero. Photograph → WebGL light-trail field → scrims → type.
 * The WebGL layer is an enhancement gated on capability and reduced motion;
 * the composition beneath it is complete on its own.
 */
export function Hero() {
  const [gl, setGl] = useState(false);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setGl(!reduced && supportsWebGL());
  }, []);

  const h = HOME.hero;

  return (
    <section
      id="hero"
      data-section="hero"
      data-surface="deep"
      data-hero
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden bg-[var(--surface)] text-[var(--text-hi)]"
    >
      <div className="absolute inset-0 -z-10">
        <Plate
          slot="hero-carrier"
          sizes="100vw"
          priority
          aspect="fill"
          parallax={7}
          reveal={false}
          overscan={1.12}
          dim={0.9}
          className="!absolute inset-0 h-full w-full"
        />
        {gl && <HeroField className="absolute inset-0" />}
        <div aria-hidden className="absolute inset-0 scrim-left opacity-90" />
        <div aria-hidden className="absolute inset-0 scrim-bottom" />
        <div aria-hidden className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[rgba(4,7,13,0.55)] to-transparent" />
      </div>

      <div className="shell relative z-10 flex flex-col gap-5 pb-[clamp(2rem,5vh,4rem)] pt-[calc(var(--nav-h)+3rem)] lg:gap-6">
        <Reveal immediate delay={0.15} y={12}>
          <Eyebrow>{h.eyebrow}</Eyebrow>
        </Reveal>

        <RevealText as="h1" id="hero-title" immediate delay={0.25} className="display-xl max-w-[13ch] !text-[clamp(3.1rem,1.6rem+5.6vw,7.4rem)]">
          {h.title}
        </RevealText>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end">
          <Reveal immediate delay={0.7} y={18}>
            <p className="lead max-w-[54ch]">{h.lead}</p>
          </Reveal>

          <Reveal immediate delay={0.85} y={18} className="flex flex-col gap-4 lg:items-end">
            <div className="flex flex-wrap gap-3">
              <Button href={h.primary.href}>{h.primary.label}</Button>
              <Button href={h.secondary.href} variant="glass">
                {h.secondary.label}
              </Button>
            </div>
            <Link href={h.tertiary.href} className="link-underline small w-fit text-[var(--text-mid)]">
              {h.tertiary.label} →
            </Link>
          </Reveal>
        </div>

        <Reveal immediate delay={1.05} y={14}>
          <dl className="mt-1 grid grid-cols-3 gap-4 border-t border-[var(--line-strong)] pt-5 md:max-w-[62ch] md:gap-8">
            {h.claims.map((c) => (
              <div key={c.label} className="flex flex-col gap-1">
                <dt className="sr-only">{c.label}</dt>
                <dd className="font-display text-[var(--step-3)] font-semibold leading-none tracking-[-0.03em] [font-stretch:105%]">{c.value}</dd>
                <dd className="small !text-[var(--text-low)]">{c.label}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
