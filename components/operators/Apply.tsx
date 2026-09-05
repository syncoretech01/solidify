"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, EASE, MQ } from "@/lib/motion";
import { Plate } from "@/components/ui/Plate";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { Section, SectionMark, Lines } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";
import { LightSweep } from "@/components/ui/LightSweep";
import { APPLY_URL } from "@/lib/site";

type Stage = {
  title: string;
  text: string;
  /** Whose systems the stage happens on. The break in the line marks the change. */
  where: "solidify" | "portal";
};

/**
 * The owner-operator application route — the signature interaction of
 * /owner-operators, and the only place on this site that leaves the domain.
 *
 * Seven stages on one pinned horizontal rail. A line advances stage to stage
 * as you scroll and each node lights as the line reaches it. Between stage 03
 * and stage 04 the line leaves Solidify's ground: it breaks, the card surface
 * changes, and it picks up again at stage 06. That break is the whole point —
 * the application itself is completed somewhere else, and the visitor should
 * see that before they get there rather than after.
 *
 * Scroll budget is deliberate: SETTLE px of travel per stage, plus a landing
 * allowance, and a snap that lands on stage centres. An earlier version
 * derived the distance from track width alone, which gave roughly 290px per
 * stage at 1920 — fast enough that cards went past unread.
 *
 * Mobile: the same seven stages as a snap carousel, no pin.
 * Reduced motion: the whole route drawn, every card visible, nothing pinned.
 */
const STAGES: readonly Stage[] = [
  { title: "Learn", text: "Read how running with Solidify works: what you carry, how you are paid, and where the loads run.", where: "solidify" },
  { title: "Review requirements", text: "Check your Truck / Power Unit, licensing and insurance against the requirements above before you start.", where: "solidify" },
  { title: "Continue to driver application", text: "The application is completed through an external driver application portal. It opens in a new tab.", where: "portal" },
  { title: "Application review", text: "Solidify reviews the application you submitted on the portal.", where: "portal" },
  { title: "Approved operator", text: "Once you are approved, Solidify gives you an access code for onboarding.", where: "portal" },
  { title: "Secure Solidify onboarding", text: "Use the code further down this page to complete your profile, equipment, insurance, W-9 and direct deposit.", where: "solidify" },
  { title: "Submission delivered to Solidify", text: "Your completed onboarding is delivered straight to Solidify. This website keeps no copy of it.", where: "solidify" },
];

/** The line leaves Solidify's ground after stage 03 and returns at stage 06. */
const HANDOFF = 2;
/** Scroll travel per stage, in px, on top of the horizontal distance. */
const SETTLE = 210;

export function ApplicationRoute() {
  const root = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  useGSAP(
    () => {
      const el = root.current;
      const track = trackRef.current;
      if (!el || !track) return;
      const fill = el.querySelector<HTMLElement>("[data-route-fill]");
      const head = el.querySelector<HTMLElement>("[data-route-head]");

      if (window.matchMedia(MQ.reduced).matches) {
        if (fill) gsap.set(fill, { scaleX: 1 });
        setActive(STAGES.length - 1);
        return;
      }

      const setActiveIndex = (i: number) => {
        const clamped = Math.max(0, Math.min(STAGES.length - 1, i));
        if (clamped === activeRef.current) return;
        activeRef.current = clamped;
        setActive(clamped);
      };

      const mm = gsap.matchMedia();

      mm.add(MQ.desktop, () => {
        const distance = () => Math.max(0, track.scrollWidth - el.clientWidth);
        const st = ScrollTrigger.create({
          trigger: el,
          start: "top top",
          end: () => "+=" + (distance() + STAGES.length * SETTLE + window.innerHeight * 0.5),
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          scrub: 1,
          invalidateOnRefresh: true,
          /* Land on a stage rather than between two of them. */
          snap: {
            snapTo: (v) => Math.round(v * (STAGES.length - 1)) / (STAGES.length - 1),
            duration: { min: 0.15, max: 0.45 },
            delay: 0.06,
            ease: EASE.settle,
            inertia: false,
          },
          onUpdate: (self) => {
            const p = self.progress;
            gsap.set(track, { x: -p * distance() });
            if (fill) fill.style.transform = `scaleX(${p})`;
            if (head) head.style.left = `${p * 100}%`;
            setActiveIndex(Math.round(p * (STAGES.length - 1)));
          },
        });
        return () => st.kill();
      });

      mm.add(MQ.mobile, () => {
        const io = new IntersectionObserver(
          (entries) => {
            const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (!hit) return;
            setActiveIndex(Number((hit.target as HTMLElement).dataset.index ?? 0));
          },
          { threshold: [0.5, 0.75] },
        );
        const cards = gsap.utils.toArray<HTMLElement>("[data-stage-card]", el);
        cards.forEach((c) => io.observe(c));
        return () => io.disconnect();
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  const pct = (i: number) => (i / (STAGES.length - 1)) * 100;

  return (
    <Section surface="deep" id="route" ariaLabelledBy="route-title" head="index" flush className="overflow-clip" field="transit" fieldIntensity={0.8}>
      <div ref={root} className="relative flex min-h-[100svh] flex-col justify-center gap-10 py-[clamp(4rem,8vh,6rem)]">
        <div aria-hidden className="pointer-events-none absolute inset-0 guides opacity-40" />

        <div className="shell relative flex flex-col gap-6">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-10">
            <div className="lg:col-span-7">
              <SectionMark index={3} label="From here to your first load" />
              <RevealText as="h2" id="route-title" className="display-md mt-5 max-w-[15ch]" mode="lines">
                <Lines text={["Seven stages,", "start to first load."]} />
              </RevealText>
            </div>
            <Reveal className="lg:col-span-5 lg:justify-self-end">
              <p className="lead lg:max-w-[38ch]">
                Four of them happen on Solidify&apos;s own systems. The application itself is completed on an external driver application portal — the break in the line is where that happens.
              </p>
            </Reveal>
          </div>
        </div>

        <div className="relative w-full overflow-hidden">
          <div
            ref={trackRef}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-gutter pb-3 [scrollbar-width:none] lg:snap-none lg:overflow-visible lg:pr-[26vw]"
          >
            {STAGES.map((s, i) => (
              <article
                key={s.title}
                data-stage-card
                data-index={i}
                data-on={i <= active ? "true" : "false"}
                data-where={s.where}
                className="group relative flex w-[80vw] flex-none snap-center flex-col gap-5 rounded-[var(--radius-panel)] border border-[var(--line)] p-5 transition-[border-color,opacity,background-color] duration-500 data-[on=false]:opacity-70 data-[on=true]:border-[rgba(179,212,255,0.34)] data-[where=portal]:bg-[color-mix(in_srgb,var(--color-graphite-700)_55%,transparent)] sm:w-[48vw] lg:min-h-[clamp(280px,34svh,360px)] lg:w-[23vw] lg:p-6"
              >
                <LightSweep trigger="hover" />
                <div className="relative flex items-baseline justify-between">
                  <span className="numeral text-[clamp(1.5rem,1.1rem+1vw,2.1rem)] leading-none text-[rgba(242,245,249,0.4)] transition-colors duration-500 group-data-[on=true]:text-[rgba(179,212,255,0.9)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="spec">{s.where === "portal" ? "Driver portal" : "Solidify"}</span>
                </div>
                <div aria-hidden className="relative h-px w-full bg-[var(--line)]">
                  <span className="absolute inset-y-0 left-0 block w-0 bg-[rgba(179,212,255,0.75)] transition-[width] duration-700 ease-[var(--ease-arrive)] group-data-[on=true]:w-full" />
                </div>
                <div className="relative flex flex-col gap-3">
                  <h3 className="title-sm max-w-[16ch]">{s.title}</h3>
                  <p className="small max-w-[38ch]">{s.text}</p>
                </div>
                {i === HANDOFF ? (
                  <a href="#apply" className="link-trace relative self-start text-[var(--step--1)] font-medium text-[var(--text-hi)]">
                    Go to the application
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </div>

        {/* the rail: it breaks where the work leaves Solidify */}
        <div className="shell relative flex items-center gap-5">
          <div className="relative h-px flex-1 bg-[var(--line-strong)]">
            <div data-route-fill className="absolute inset-y-0 left-0 w-full origin-left bg-[rgba(179,212,255,0.85)]" style={{ transform: "scaleX(0)" }} />
            <span
              aria-hidden
              data-route-head
              className="absolute top-1/2 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#dbe9ff] shadow-[0_0_16px_4px_rgba(127,182,255,0.55)]"
              style={{ left: "0%" }}
            />
            {/* the hand-off gap, painted over the rail */}
            <span
              aria-hidden
              className="absolute top-1/2 h-[3px] -translate-y-1/2 bg-[var(--surface)]"
              style={{ left: `${pct(HANDOFF + 0.35)}%`, width: `${pct(0.3)}%` }}
            />
            {STAGES.map((s, i) => (
              <span
                key={s.title}
                aria-hidden
                data-on={i <= active ? "true" : "false"}
                className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(179,212,255,0.55)] bg-[var(--surface)] transition-colors duration-500 data-[on=true]:bg-[#b3d4ff]"
                style={{ left: `${pct(i)}%` }}
              />
            ))}
          </div>
          <span className="spec whitespace-nowrap" aria-live="polite">
            {String(active + 1).padStart(2, "0")} / {String(STAGES.length).padStart(2, "0")} · {STAGES[active].title}
          </span>
        </div>
      </div>
    </Section>
  );
}

/**
 * The application panel. Deliberately plain about the transition: the operator
 * should know exactly where they are about to go, what to have ready, and what
 * happens when they come back. Solidify's relationship with the portal's
 * operator is not confirmed, so nothing here describes it as run for Solidify.
 */
export function ApplyPanel() {
  return (
    <Section surface="graphite" id="apply" ariaLabelledBy="apply-title" head="editorial">
      <div className="shell relative">
        <div className="plate plate-steel relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0 guides" />
          <LightSweep trigger="inview" delay={0.4} />
          <div className="relative grid gap-8 p-6 lg:grid-cols-12 lg:items-center lg:gap-12 lg:p-10">
            <div className="lg:col-span-4">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)]">
                <Plate slot="oo-apply" sizes="(max-width: 1024px) 90vw, 30vw" aspect="fill" parallax={6} reveal={false} overscan={1.06} grade="cool" dim={0.82} className="!absolute inset-0 h-full w-full" />
                <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,transparent_38%,rgba(5,7,11,0.82))]" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <span className="spec !text-[var(--text-hi)]">Stage 03 · the application</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-5 lg:col-span-8">
              <SectionMark index={4} label="The application" />
              <RevealText as="h2" id="apply-title" className="display-md max-w-[16ch]" mode="lines">
                <Lines text={["Start your", "application."]} />
              </RevealText>
              <p className="lead">The application is completed through an external driver application portal. It will open in a new tab.</p>
              <p className="body max-w-[58ch]">
                Have your Truck / Power Unit details, licensing and insurance information to hand. Once Solidify has reviewed and approved your application, you will be given an access code to complete secure onboarding back here on this page.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <Button href={APPLY_URL} external variant="metal">
                  Continue to driver application
                </Button>
                <Button href="#onboarding" variant="steel">
                  Approved? Begin onboarding
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
