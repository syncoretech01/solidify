import { Plate } from "@/components/ui/Plate";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHead, Index, PhoneLink, type Surface } from "@/components/ui/Primitives";
import { COMPANY, ADDRESS_LINES } from "@/lib/site";
import type { MediaId } from "@/lib/media";

type Item = { title: string; text: string };

/** Four trust points beside a photograph and the real company identity. */
export function TrustGrid({
  id = "why",
  eyebrow,
  title,
  items,
  slot,
  surface = "ice",
}: {
  id?: string;
  eyebrow: string;
  title: string;
  items: readonly Item[];
  slot: MediaId;
  surface?: Surface;
}) {
  return (
    <Section surface={surface} id={id} ariaLabelledBy={`${id}-title`}>
      <div className="shell flex flex-col gap-12">
        <SectionHead eyebrow={eyebrow} title={title} id={`${id}-title`} />
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <Plate slot={slot} sizes="(max-width: 1024px) 100vw, 42vw" className="steel-edge" radius="var(--radius-panel)" scrim="bottom">
              <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-1 p-6 text-white lg:p-7">
                <span className="label !text-white/70">Company identity</span>
                <span className="font-display text-[var(--step-1)] font-semibold">{COMPANY.legalName}</span>
                <span className="text-white/85">{ADDRESS_LINES.join(" · ")}</span>
                <PhoneLink className="link-underline w-fit font-medium text-white" />
              </div>
            </Plate>
          </div>
          <Reveal staggerChildren className="grid gap-4 sm:grid-cols-2 lg:col-span-7 lg:gap-5">
            {items.map((it, i) => (
              <div key={it.title} className="card flex flex-col gap-4 p-6 lg:p-7">
                <Index n={i + 1} />
                <h3 className="title-sm">{it.title}</h3>
                <p className="body">{it.text}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
