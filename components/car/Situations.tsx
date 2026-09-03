"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import clsx from "clsx";
import { gsap, ScrollTrigger, MQ } from "@/lib/motion";
import { Plate } from "@/components/ui/Plate";
import { Section, SectionMark, Lines } from "@/components/ui/Primitives";
import { RevealText, Reveal } from "@/components/ui/Reveal";
import { LightSweep } from "@/components/ui/LightSweep";
import { Blueprint } from "@/components/graphics/Blueprint";
import type { MediaId } from "@/lib/media";

type Panel = { title: string; text: string; slot?: MediaId; icon?: "iconCar" | "iconRows" | "iconHauler"; kicker?: string };

const PANELS: readonly Panel[] = [
  { title: "Relocating", text: "Moving across the state or across the country, and one vehicle needs to arrive with you.", slot: "cs-situation-1" },
  { title: "Buying out of state", text: "Found the right vehicle in another state. The carrier picks it up and delivers it to your door.", icon: "iconCar" },
  { title: "Seasonal moves", text: "A vehicle that spends part of the year somewhere else, moved each way by the same carrier.", slot: "cs-situation-2" },
  { title: "Students and military", text: "A car that needs to be at a campus or a new duty station without adding miles to get there.", icon: "iconHauler" },
  { title: "Family vehicles", text: "Sending a car to a family member, or bringing one home.", slot: "cs-situation-3" },
  { title: "Dealer transfers", text: "Dealerships move vehicles the same way. See how we work with OEMs and dealerships.", icon: "iconRows", kicker: "Commercial" },
];

/**
 * Six situations as a horizontal strip with rhythm: photograph, type,
 * photograph, type. Scroll-snap on every device; on desktop the strip is
 * scrubbed sideways by the page scroll and a progress hairline tracks it.
 */
export function Situations({ id = "situations" }: { id?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const track = el.querySelector<HTMLElement>("[data-track]");
      const fill = el.querySelector<HTMLElement>("[data-fill]");
      if (!track) return;
      if (window.matchMedia(MQ.reduced).matches) return;
      const mm = gsap.matchMedia();
      mm.add(MQ.desktop, () => {
        const distance = () => Math.max(0, track.scrollWidth - track.clientWidth);
        const st = ScrollTrigger.create({
          trigger: el,
          start: "top 70%",
          end: "bottom 30%",
          scrub: 0.8,
          onUpdate: (self) => {
            track.scrollLeft = self.progress * distance();
            if (fill) fill.style.transform = `scaleX(${self.progress.toFixed(4)})`;
          },
        });
        return () => st.kill();
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <Section surface="navy" id={id} ariaLabelledBy={`${id}-title`} head="editorial" className="overflow-clip">
      <div ref={root} className="shell flex flex-col gap-10">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-6 border-t border-[var(--line-strong)] pt-4">
            <SectionMark index={2} label="Who ships a vehicle" />
            <span aria-hidden className="hidden h-px flex-1 bg-[var(--line)] sm:block" />
            <span className="spec hidden sm:inline">Six situations</span>
          </div>
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-10">
            <RevealText as="h2" id={`${id}-title`} className="display-md max-w-[16ch] lg:col-span-7">
              <Lines text={["Common reasons", "people ship a vehicle."]} />
            </RevealText>
            <Reveal className="lg:col-span-5 lg:justify-self-end">
              <p className="lead lg:max-w-[38ch]">Whatever the reason, the vehicle rides on a car carrier — loaded, secured and unloaded by the carrier — with no miles added.</p>
            </Reveal>
          </div>
        </div>

        <div
          data-track
          className="-mx-[var(--spacing-gutter)] flex snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--spacing-gutter)] pb-3 [scrollbar-width:none] lg:snap-none [&::-webkit-scrollbar]:hidden"
        >
          {PANELS.map((p, i) => (
            <article
              key={p.title}
              className={clsx("plate plate-steel relative flex w-[78vw] flex-none snap-center flex-col justify-between overflow-hidden sm:w-[54vw] lg:w-[30vw]", "min-h-[420px]")}
            >
              <div aria-hidden className="pointer-events-none absolute inset-0 guides" />
              <LightSweep trigger="hover" />
              {p.slot ? (
                <div className="absolute inset-0">
                  <Plate slot={p.slot} sizes="(max-width: 1024px) 78vw, 30vw" aspect="fill" parallax={0} reveal={false} overscan={1.04} grade="deep" className="!absolute inset-0 h-full w-full" />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[rgba(5,7,11,0.92)] via-[rgba(5,7,11,0.3)] to-[rgba(5,7,11,0.15)]" />
                </div>
              ) : (
                <div className="absolute inset-x-6 top-16 opacity-80 lg:inset-x-8">
                  <Blueprint view={p.icon ?? "iconCar"} draw className="w-full" />
                </div>
              )}
              <div className="relative flex items-start justify-between p-5 lg:p-6">
                <span className="index-xl !text-[clamp(1.6rem,1.2rem+1.2vw,2.4rem)]">{String(i + 1).padStart(2, "0")}</span>
                {p.kicker && <span className="spec">{p.kicker}</span>}
              </div>
              <div className="relative flex flex-col gap-2.5 p-5 lg:p-6">
                <h3 className="display-sm max-w-[12ch]">{p.title}</h3>
                <p className="body max-w-[36ch] !text-[rgba(242,245,249,0.85)]">{p.text}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="relative h-px bg-[var(--line-strong)]">
          <div data-fill className="absolute inset-y-0 left-0 w-full origin-left bg-[rgba(179,212,255,0.85)]" style={{ transform: "scaleX(0)" }} />
        </div>
      </div>
    </Section>
  );
}
