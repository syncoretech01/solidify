"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, EASE, MQ } from "@/lib/motion";
import { Section, SectionMark, Lines, ApplyLink } from "@/components/ui/Primitives";
import { RevealText, Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { LightSweep } from "@/components/ui/LightSweep";
import { APPLY_URL } from "@/lib/site";

/**
 * Two paths, never conflated: a new application leaves for the driver
 * portal; an approved operator continues into secure onboarding below.
 * Drawn panels — no photographs, no reserved frames.
 */
export function Paths({ id = "paths" }: { id?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const lines = el.querySelectorAll<SVGPathElement>("[data-draw]");
      if (window.matchMedia(MQ.reduced).matches) {
        gsap.set(lines, { drawSVG: "100%" });
        return;
      }
      gsap.set(lines, { drawSVG: "0%" });
      gsap.to(lines, { drawSVG: "100%", duration: 1.6, ease: EASE.inOut, stagger: 0.12, scrollTrigger: { trigger: el, start: "top 75%", once: true } });
    },
    { scope: root },
  );

  return (
    <Section surface="navy" id={id} ariaLabelledBy={`${id}-title`} head="editorial">
      <div className="shell flex flex-col gap-10">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-6 border-t border-[var(--line-strong)] pt-4">
            <SectionMark index={3} label="Two paths" />
            <span aria-hidden className="hidden h-px flex-1 bg-[var(--line)] sm:block" />
          </div>
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-10">
            <RevealText as="h2" id={`${id}-title`} className="display-md max-w-[16ch] lg:col-span-7">
              <Lines text={["New applicant,", "or already approved?"]} />
            </RevealText>
            <Reveal className="lg:col-span-5 lg:justify-self-end">
              <p className="lead lg:max-w-[38ch]">New owner-operators apply through the driver portal. Approved operators complete onboarding here, with an access code from Solidify.</p>
            </Reveal>
          </div>
        </div>

        <div ref={root} className="grid gap-5 lg:grid-cols-2">
          {/* 01 new application */}
          <article className="plate plate-steel relative flex min-h-[420px] flex-col justify-between overflow-hidden p-6 lg:p-8" aria-labelledby={`${id}-new`}>
            <div aria-hidden className="pointer-events-none absolute inset-0 guides" />
            <LightSweep trigger="hover" />
            <div className="relative flex items-start justify-between">
              <span className="index-xl">01</span>
              <span className="spec">New application</span>
            </div>
            <svg aria-hidden viewBox="0 0 600 200" className="relative my-6 w-full" fill="none">
              <path data-draw d="M 20 150 C 140 150, 220 60, 360 60 S 540 110, 580 40" stroke="rgba(179,212,255,0.75)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
              <path data-draw d="M 548 28 H 582 V 62" stroke="#b3d4ff" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
              <path data-draw d="M 582 28 L 530 80" stroke="#b3d4ff" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
              <circle cx="20" cy="150" r="4" fill="#b3d4ff" />
              <text x="20" y="182" fontFamily="var(--font-mono)" fontSize="12" letterSpacing="1.5" fill="#8b95a4">HERE</text>
              <text x="440" y="182" fontFamily="var(--font-mono)" fontSize="12" letterSpacing="1.5" fill="#8b95a4">DRIVER PORTAL</text>
            </svg>
            <div className="relative flex flex-col gap-4">
              <h3 id={`${id}-new`} className="title">
                Apply through the driver portal.
              </h3>
              <p className="body max-w-[44ch]">The application opens in a new tab and asks for your operating, equipment and insurance details.</p>
              <div className="pt-1">
                <Button href={APPLY_URL} external>
                  Start a new application
                </Button>
              </div>
            </div>
          </article>

          {/* 02 approved */}
          <article className="plate plate-steel relative flex min-h-[420px] flex-col justify-between overflow-hidden p-6 lg:p-8" aria-labelledby={`${id}-approved`}>
            <div aria-hidden className="pointer-events-none absolute inset-0 guides" />
            <LightSweep trigger="hover" />
            <div className="relative flex items-start justify-between">
              <span className="index-xl">02</span>
              <span className="spec">Approved · onboarding</span>
            </div>
            <svg aria-hidden viewBox="0 0 600 200" className="relative my-6 w-full" fill="none">
              <path data-draw d="M 40 120 H 560" stroke="rgba(179,212,255,0.55)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <g key={i}>
                  <circle cx={40 + i * 104} cy="120" r="7" stroke="#b3d4ff" strokeWidth="1.2" fill="#0b0f18" />
                  <text x={40 + i * 104} y="152" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12" letterSpacing="1.5" fill="#8b95a4">
                    {["PROFILE", "EQUIPMENT", "INSURANCE", "W-9", "DEPOSIT", "REVIEW"][i]}
                  </text>
                </g>
              ))}
              <path data-draw d="M 500 40 h 60 v 44 h -60 z M 512 40 v -10 a 18 18 0 0 1 36 0 v 10" stroke="#b3d4ff" strokeWidth="1.3" vectorEffect="non-scaling-stroke" />
              <text x="470" y="66" textAnchor="end" fontFamily="var(--font-mono)" fontSize="12" letterSpacing="1.5" fill="#8b95a4">ENCRYPTED · NEVER EMAILED</text>
            </svg>
            <div className="relative flex flex-col gap-4">
              <h3 id={`${id}-approved`} className="title">
                Complete secure onboarding here.
              </h3>
              <p className="body max-w-[44ch]">
                Use the access code Solidify gave you to complete your profile, equipment and licensing, insurance certificates, W-9 and direct-deposit authorization. Not approved yet?{" "}
                <ApplyLink className="link-underline text-[var(--text-hi)]">Start a new application</ApplyLink> first.
              </p>
              <div className="pt-1">
                <Button href="#onboarding" variant="steel">
                  Begin onboarding
                </Button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </Section>
  );
}
