"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, EASE, MQ } from "@/lib/motion";
import { Plate } from "@/components/ui/Plate";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { Section, SectionMark, Lines } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";
import { APPLY_URL } from "@/lib/site";

type Stage = {
  title: string;
  text: string;
  /** Where the work happens. The hand-off is what the visual break marks. */
  where: "solidify" | "portal";
};

/**
 * The application journey — the signature interaction of /become-a-driver.
 *
 * Seven stages on one pinned horizontal route. A single line advances stage to
 * stage as you scroll and each node lights as the line reaches it. Between
 * stage 03 and stage 04 the line leaves Solidify's ground: it breaks, the
 * surface behind it changes, and it picks up again at stage 05. That break is
 * the point — the application itself is completed somewhere else.
 *
 * Mobile: the same seven stages as a vertical rail, no pin.
 * Reduced motion: the whole route drawn, every card visible.
 */
const STAGES: readonly Stage[] = [
  { title: "Learn", text: "Read how running with Solidify works: what you carry, how you are paid, and where the loads run.", where: "solidify" },
  { title: "Review requirements", text: "Check your Truck / Power Unit, licensing and insurance against the requirements above before you start.", where: "solidify" },
  { title: "Continue to driver application", text: "The application is completed through an external driver application portal. It opens in a new tab.", where: "portal" },
  { title: "Application review", text: "Solidify reviews the application you submitted on the portal.", where: "portal" },
  { title: "Approved driver", text: "Once you are approved, Solidify gives you an access code for onboarding.", where: "portal" },
  { title: "Secure Solidify onboarding", text: "Use the code on the owner-operators page to complete your profile, equipment, insurance, W-9 and direct deposit.", where: "solidify" },
  { title: "Submission delivered to Solidify", text: "Your completed onboarding is delivered straight to Solidify. This website keeps no copy of it.", where: "solidify" },
];

const HANDOFF = 2; // the line leaves Solidify's ground after stage 03

export function Journey() {
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
      const reduced = window.matchMedia(MQ.reduced).matches;
      if (reduced) {
        if (fill) gsap.set(fill, { scaleX: 1 });
        setActive(STAGES.length - 1);
        return;
      }

      const mm = gsap.matchMedia();

      mm.add(MQ.desktop, () => {
        const distance = () => Math.max(0, track.scrollWidth - el.clientWidth);
        const st = ScrollTrigger.create({
          trigger: el,
          start: "top top",
          end: () => "+=" + (distance() + window.innerHeight * 0.7),
          pin: true,
          scrub: 0.7,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;
            gsap.set(track, { x: -p * distance() });
            if (fill) fill.style.transform = `scaleX(${p})`;
            const i = Math.min(STAGES.length - 1, Math.floor(p * STAGES.length));
            if (i !== activeRef.current) {
              activeRef.current = i;
              setActive(i);
            }
          },
        });
        return () => st.kill();
      });

      mm.add(MQ.mobile, () => {
        const io = new IntersectionObserver(
          (entries) => {
            const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (!hit) return;
            const i = Number((hit.target as HTMLElement).dataset.index ?? 0);
            if (i !== activeRef.current) {
              activeRef.current = i;
              setActive(i);
            }
          },
          { threshold: [0.55] },
        );
        gsap.utils.toArray<HTMLElement>("[data-stage-card]", el).forEach((c) => io.observe(c));
        return () => io.disconnect();
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <Section surface="deep" id="journey" ariaLabelledBy="journey-title" head="index" flush className="overflow-clip">
      <div ref={root} className="relative flex min-h-[100svh] flex-col justify-center gap-10 py-[clamp(4rem,8vh,6rem)]">
        <div aria-hidden className="pointer-events-none absolute inset-0 guides opacity-40" />

        <div className="shell relative flex flex-col gap-6">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-10">
            <div className="lg:col-span-7">
              <SectionMark index={4} label="From here to your first load" />
              <RevealText as="h2" id="journey-title" className="display-md mt-5 max-w-[15ch]" mode="lines">
                <Lines text={["Seven stages,", "start to first load."]} />
              </RevealText>
            </div>
            <Reveal className="lg:col-span-5 lg:justify-self-end">
              <p className="lead lg:max-w-[38ch]">
                Three of them happen on Solidify&apos;s own systems. The application itself is completed on an external driver application portal — the break in the line is where that happens.
              </p>
            </Reveal>
          </div>
        </div>

        {/* the route */}
        <div className="relative w-full overflow-hidden">
          <div ref={trackRef} className="flex gap-4 overflow-x-auto px-gutter pb-3 [scrollbar-width:none] lg:overflow-visible lg:pr-[30vw]">
            {STAGES.map((s, i) => (
              <article
                key={s.title}
                data-stage-card
                data-index={i}
                data-on={i <= active ? "true" : "false"}
                data-where={s.where}
                className="group relative flex w-[78vw] flex-none flex-col justify-between gap-6 rounded-[var(--radius-panel)] border border-[var(--line)] p-5 transition-[border-color,opacity] duration-500 data-[on=false]:opacity-55 data-[on=true]:border-[rgba(179,212,255,0.32)] sm:w-[46vw] lg:min-h-[clamp(300px,40svh,400px)] lg:w-[23vw] lg:p-6 data-[where=portal]:bg-[color-mix(in_srgb,var(--color-graphite-700)_55%,transparent)]"
              >
                <div className="flex items-baseline justify-between">
                  <span className="numeral text-[clamp(1.5rem,1.1rem+1vw,2.1rem)] leading-none text-[rgba(242,245,249,0.4)] transition-colors duration-500 group-data-[on=true]:text-[rgba(179,212,255,0.9)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="spec">{s.where === "portal" ? "Driver portal" : "Solidify"}</span>
                </div>
                <div className="mt-auto flex flex-col gap-3">
                  <h3 className="title-sm max-w-[16ch]">{s.title}</h3>
                  <p className="small max-w-[38ch]">{s.text}</p>
                </div>
                {i === HANDOFF ? (
                  <a href="#apply" className="link-trace self-start text-[var(--step--1)] font-medium text-[var(--text-hi)]">
                    Continue to driver application
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </div>

        {/* the line: it breaks where the work leaves Solidify */}
        <div className="shell relative flex items-center gap-5">
          <div className="relative h-px flex-1 bg-[var(--line-strong)]">
            <div data-route-fill className="absolute inset-y-0 left-0 w-full origin-left bg-[rgba(179,212,255,0.85)]" style={{ transform: "scaleX(0)" }} />
            {/* the hand-off gap, painted over the rail */}
            <span
              aria-hidden
              className="absolute top-1/2 h-[3px] -translate-y-1/2 bg-[var(--surface)]"
              style={{ left: `${((HANDOFF + 0.35) / (STAGES.length - 1)) * 100}%`, width: `${(0.3 / (STAGES.length - 1)) * 100}%` }}
            />
            {STAGES.map((s, i) => (
              <span
                key={s.title}
                aria-hidden
                data-on={i <= active ? "true" : "false"}
                className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(179,212,255,0.55)] bg-[var(--surface)] transition-colors duration-500 data-[on=true]:bg-[#b3d4ff]"
                style={{ left: `${(i / (STAGES.length - 1)) * 100}%` }}
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
 * The external transition. Deliberately plain: the applicant should know
 * exactly where they are about to go and what happens when they get back.
 */
export function PortalHandoff() {
  return (
    <Section surface="graphite" id="apply" ariaLabelledBy="apply-title" head="editorial">
      <div className="shell relative">
        <div className="plate plate-steel relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0 guides" />
          <div className="relative grid gap-8 p-6 lg:grid-cols-12 lg:items-center lg:gap-12 lg:p-10">
            <div className="lg:col-span-4">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-sm)]">
                <Plate slot="driver-rail" sizes="(max-width: 1024px) 90vw, 30vw" aspect="fill" parallax={6} reveal={false} overscan={1.06} grade="cool" dim={0.8} className="!absolute inset-0 h-full w-full" />
                <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(5,7,11,0.8))]" />
              </div>
            </div>
            <div className="flex flex-col gap-5 lg:col-span-8">
              <SectionMark index={5} label="The application" />
              <RevealText as="h2" id="apply-title" className="display-md max-w-[16ch]" mode="lines">
                <Lines text={["Ready to apply?"]} />
              </RevealText>
              <p className="lead">
                The application is completed through an external driver application portal. It will open in a new tab.
              </p>
              <p className="body max-w-[58ch]">
                Have your Truck / Power Unit details, licensing and insurance information to hand. Once Solidify has reviewed and approved your application, you will be given an access code to complete secure onboarding back here.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <Button href={APPLY_URL} external variant="metal">
                  Continue to driver application
                </Button>
                <Button href="/owner-operators#onboarding" variant="steel">
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
