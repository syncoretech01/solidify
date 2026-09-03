import type { ReactNode } from "react";
import clsx from "clsx";
import { Plate } from "@/components/ui/Plate";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { Section, SectionMark, SpecStrip, PhoneLink, Lines, type Surface, type SpecItem } from "@/components/ui/Primitives";
import { LightSweep } from "@/components/ui/LightSweep";
import { InquiryForm, type Lane } from "@/components/forms/InquiryForm";
import { COMPANY, ADDRESS_LINES } from "@/lib/site";
import type { MediaId } from "@/lib/media";

/**
 * The graphite console every inquiry form lives in: a rail with the spec of
 * what we need and the office, a route hairline, and the form itself. The
 * backend's honest failure states render inside it as designed panels.
 */
export function FormConsole({
  id,
  lane,
  mark,
  title,
  lead,
  specs,
  slot,
  surface = "deep",
  rail,
  children,
  className,
}: {
  id: string;
  lane: Lane;
  mark: { index: string | number; label: string };
  title: string | readonly string[];
  lead: string;
  specs?: readonly SpecItem[];
  /** Dimmed photograph behind the console rail. */
  slot?: MediaId;
  surface?: Surface;
  /** Extra rail content (e.g. the mini route map). */
  rail?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Section surface={surface} id={id} ariaLabelledBy={`${id}-title`} head="editorial" className={clsx("overflow-clip", className)}>
      <div className="shell flex flex-col gap-10">
        <div className="flex items-center justify-between gap-6 border-t border-[var(--line-strong)] pt-4">
          <SectionMark index={mark.index} label={mark.label} />
          <span aria-hidden className="hidden h-px flex-1 bg-[var(--line)] sm:block" />
          <span className="spec hidden sm:inline">{COMPANY.descriptor}</span>
        </div>

        <div className="plate relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0 guides" />
          <LightSweep trigger="inview" />
          <div className="relative grid lg:grid-cols-12">
            {/* rail */}
            <div className="relative flex flex-col gap-8 overflow-hidden border-b border-[var(--line)] p-6 sm:p-8 lg:col-span-5 lg:border-b-0 lg:border-r lg:p-10">
              {slot && (
                <div className="absolute inset-0 -z-10 opacity-30">
                  <Plate slot={slot} sizes="(max-width: 1024px) 100vw, 40vw" aspect="fill" grade="deep" parallax={6} reveal={false} dim={0.6} className="!absolute inset-0 h-full w-full" />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-[var(--surface-raised)]/40 via-transparent to-[var(--surface-raised)]" />
                </div>
              )}
              <div className="flex flex-col gap-5">
                <RevealText as="h2" id={`${id}-title`} className="display-md max-w-[12ch]">
                  <Lines text={title} />
                </RevealText>
                <Reveal>
                  <p className="lead max-w-[40ch]">{lead}</p>
                </Reveal>
              </div>
              {specs && (
                <Reveal>
                  <SpecStrip items={specs} layout="list" tone="quiet" />
                </Reveal>
              )}
              {rail}
              <Reveal className="mt-auto flex flex-col gap-1 pt-4 small">
                <span className="label mb-1">Office</span>
                <span className="font-medium text-[var(--text-hi)]">{COMPANY.legalName}</span>
                <span>{ADDRESS_LINES.join(", ")}</span>
                <PhoneLink className="link-underline w-fit font-medium text-[var(--text-hi)]" />
              </Reveal>
            </div>
            {/* form */}
            <div className="p-6 sm:p-8 lg:col-span-7 lg:p-10">
              <InquiryForm lane={lane} bare compact />
            </div>
          </div>
          {children}
        </div>
      </div>
    </Section>
  );
}
