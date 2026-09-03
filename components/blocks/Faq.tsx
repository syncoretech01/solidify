import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHead, type Surface } from "@/components/ui/Primitives";

export type FaqItem = { q: string; a: string };

/** Native, keyboard-accessible disclosure ledger: numbered hairline rows. */
export function Faq({
  id = "faq",
  eyebrow = "Questions",
  mark,
  title,
  items,
  surface = "navy",
}: {
  id?: string;
  eyebrow?: string;
  mark?: { index: string | number; label: string };
  title: string;
  items: readonly FaqItem[];
  surface?: Surface;
}) {
  return (
    <Section surface={surface} id={id} ariaLabelledBy={`${id}-title`} head="stack">
      <div className="shell grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHead eyebrow={mark ? undefined : eyebrow} mark={mark} title={title} id={`${id}-title`} size="sm" />
        </div>
        <Reveal as="div" staggerChildren className="flex flex-col divide-y divide-[var(--line)] border-y border-[var(--line)] lg:col-span-8" stagger={0.05}>
          {items.map((it, i) => (
            <details key={it.q} className="group">
              <summary className="grid cursor-pointer list-none grid-cols-[3.2rem_1fr_auto] items-center gap-4 py-5 text-left [&::-webkit-details-marker]:hidden">
                <span className="numeral text-[var(--step--1)] text-[var(--text-low)]">{String(i + 1).padStart(2, "0")}</span>
                <span className="title-sm">{it.q}</span>
                <span
                  aria-hidden
                  className="relative h-9 w-9 flex-none rounded-md border border-[var(--line-strong)] transition-colors duration-300 group-open:border-[rgba(179,212,255,0.7)]"
                >
                  <span className="absolute left-1/2 top-1/2 h-px w-4 -translate-x-1/2 -translate-y-1/2 bg-current" />
                  <span className="absolute left-1/2 top-1/2 h-4 w-px -translate-x-1/2 -translate-y-1/2 bg-current transition-transform duration-300 group-open:scale-y-0" />
                </span>
              </summary>
              <p className="body max-w-[66ch] pb-6 pl-[3.2rem] sm:pl-[4.2rem]">{it.a}</p>
            </details>
          ))}
        </Reveal>
      </div>
    </Section>
  );
}
