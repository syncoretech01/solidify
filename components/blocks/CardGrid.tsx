import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHead, Index, type Surface } from "@/components/ui/Primitives";

type Card = { title: string; text: string; kicker?: string };

/** A titled grid of text cards — situations, audiences, requirements. */
export function CardGrid({
  id,
  eyebrow,
  title,
  lead,
  items,
  columns = 3,
  surface = "navy",
  numbered = true,
}: {
  id: string;
  eyebrow: string;
  title: string;
  lead?: string;
  items: readonly Card[];
  columns?: 2 | 3 | 4;
  surface?: Surface;
  numbered?: boolean;
}) {
  const cols = columns === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <Section surface={surface} id={id} ariaLabelledBy={`${id}-title`}>
      <div className="shell flex flex-col gap-12">
        <SectionHead eyebrow={eyebrow} title={title} lead={lead} id={`${id}-title`} />
        <Reveal staggerChildren className={`grid gap-4 lg:gap-5 ${cols}`} stagger={0.06}>
          {items.map((c, i) => (
            <div key={c.title} className="card sheen flex flex-col gap-4 p-6 lg:p-7">
              <div className="flex items-center justify-between">
                {numbered ? <Index n={i + 1} /> : <span />}
                {c.kicker && <span className="label">{c.kicker}</span>}
              </div>
              <h3 className="title-sm">{c.title}</h3>
              <p className="body">{c.text}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </Section>
  );
}
