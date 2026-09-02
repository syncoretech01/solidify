import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHead, type Surface } from "@/components/ui/Primitives";

export type FaqItem = { q: string; a: string };

/** Native, keyboard-accessible disclosure list. */
export function Faq({
  id = "faq",
  eyebrow = "Questions",
  title,
  items,
  surface = "navy",
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  items: readonly FaqItem[];
  surface?: Surface;
}) {
  return (
    <Section surface={surface} id={id} ariaLabelledBy={`${id}-title`}>
      <div className="shell grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHead eyebrow={eyebrow} title={title} id={`${id}-title`} size="sm" />
        </div>
        <Reveal as="div" staggerChildren className="flex flex-col divide-y divide-[var(--line)] border-y border-[var(--line)] lg:col-span-8" stagger={0.05}>
          {items.map((it) => (
            <details key={it.q} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left [&::-webkit-details-marker]:hidden">
                <span className="title-sm">{it.q}</span>
                <span
                  aria-hidden
                  className="relative h-9 w-9 flex-none rounded-md border border-[var(--line-strong)] transition-colors duration-300 group-open:border-[var(--color-signal-400)]"
                >
                  <span className="absolute left-1/2 top-1/2 h-px w-4 -translate-x-1/2 -translate-y-1/2 bg-current" />
                  <span className="absolute left-1/2 top-1/2 h-4 w-px -translate-x-1/2 -translate-y-1/2 bg-current transition-transform duration-300 group-open:scale-y-0" />
                </span>
              </summary>
              <p className="body max-w-[68ch] pb-6">{it.a}</p>
            </details>
          ))}
        </Reveal>
      </div>
    </Section>
  );
}
