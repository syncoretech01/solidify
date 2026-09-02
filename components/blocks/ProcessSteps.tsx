"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, MQ } from "@/lib/motion";
import { Plate } from "@/components/ui/Plate";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHead, Index, type Surface } from "@/components/ui/Primitives";
import type { MediaId } from "@/lib/media";

type Step = { title: string; text: string; slot: MediaId };

/**
 * Pickup → Transit → Delivery as a scroll-linked sequence.
 *
 * Desktop: the photograph column pins while the three steps scroll past;
 * each step's frame cross-dissolves in as its copy reaches the centre, and
 * a hairline progress rule tracks it. Mobile: a clean stacked list — no
 * pinning where scroll-jacking hurts more than it helps.
 */
export function ProcessSteps({
  id = "process",
  eyebrow,
  title,
  lead,
  steps,
  surface = "deep",
}: {
  id?: string;
  eyebrow: string;
  title: string;
  lead?: string;
  steps: readonly Step[];
  surface?: Surface;
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const mm = gsap.matchMedia();
      mm.add(MQ.desktop, () => {
        const frames = el.querySelectorAll<HTMLElement>("[data-step-frame]");
        const items = el.querySelectorAll<HTMLElement>("[data-step-item]");
        const rail = el.querySelector<HTMLElement>("[data-step-rail]");
        const stage = el.querySelector<HTMLElement>("[data-step-stage]");
        if (!frames.length || !stage) return;

        gsap.set(frames, { autoAlpha: 0, scale: 1.06 });
        gsap.set(frames[0], { autoAlpha: 1, scale: 1 });

        const triggers: ScrollTrigger[] = [];
        items.forEach((item, i) => {
          triggers.push(
            ScrollTrigger.create({
              trigger: item,
              start: "top 55%",
              end: "bottom 55%",
              onToggle: (self) => {
                if (!self.isActive) return;
                frames.forEach((f, j) => {
                  gsap.to(f, { autoAlpha: j === i ? 1 : 0, scale: j === i ? 1 : 1.06, duration: 0.9, ease: "arrive", overwrite: true });
                });
                items.forEach((it, j) => it.setAttribute("data-active", j === i ? "true" : "false"));
              },
            }),
          );
        });

        const list = el.querySelector<HTMLElement>("[data-step-list]");
        if (rail && list) {
          triggers.push(
            ScrollTrigger.create({
              trigger: list,
              start: "top 55%",
              end: "bottom 55%",
              onUpdate: (self) => (rail.style.transform = `scaleY(${self.progress.toFixed(4)})`),
            }),
          );
        }
        return () => triggers.forEach((t) => t.kill());
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <Section surface={surface} id={id} ariaLabelledBy={`${id}-title`} className="overflow-clip">
      <div ref={root} className="shell flex flex-col gap-14">
        <SectionHead eyebrow={eyebrow} title={title} lead={lead} id={`${id}-title`} />

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          {/* pinned stage */}
          <div className="hidden lg:col-span-6 lg:block">
            <div data-step-stage className="sticky top-[calc(var(--nav-h)+2rem)]">
              <div className="steel-edge relative aspect-[4/5] overflow-hidden rounded-[var(--radius-panel)] bg-[var(--surface-sunken)]">
                {steps.map((s, i) => (
                  <div key={s.slot + i} data-step-frame className="absolute inset-0">
                    <Plate slot={s.slot} sizes="50vw" aspect="fill" parallax={0} reveal={false} scrim="bottom" className="!absolute inset-0 h-full w-full" />
                    <div className="absolute bottom-6 left-6 z-[3] flex items-center gap-3">
                      <Index n={i + 1} />
                      <span className="label !text-[var(--text-mid)]">{s.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* steps */}
          <div className="relative lg:col-span-5 lg:col-start-8">
            <div aria-hidden className="absolute left-0 top-0 hidden h-full w-px bg-[var(--line)] lg:block">
              <div data-step-rail className="h-full w-px origin-top bg-[var(--accent)]" style={{ transform: "scaleY(0)" }} />
            </div>
            <ol data-step-list className="flex flex-col gap-10 lg:gap-[22vh] lg:py-[14vh] lg:pl-10">
              {steps.map((s, i) => (
                <li key={s.title} data-step-item data-active={i === 0 ? "true" : "false"} className="group flex flex-col gap-4">
                  <Plate slot={s.slot} sizes="100vw" aspect={16 / 10} parallax={6} scrim="bottom" className="steel-edge lg:hidden" radius="var(--radius-card)" />
                  <Reveal className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <Index n={i + 1} />
                      <span aria-hidden className="h-px w-8 bg-[var(--line-strong)] transition-colors duration-500 group-data-[active=true]:bg-[var(--accent)]" />
                    </div>
                    <h3 className="display-sm transition-colors duration-500 lg:text-[var(--text-mid)] lg:group-data-[active=true]:text-[var(--text-hi)]">{s.title}</h3>
                    <p className="body max-w-[44ch]">{s.text}</p>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </Section>
  );
}
