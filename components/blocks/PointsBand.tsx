import { Plate } from "@/components/ui/Plate";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { Section, Eyebrow, Index, type Surface } from "@/components/ui/Primitives";
import type { MediaId } from "@/lib/media";

type Point = { title: string; text: string };

/** A statement with a tall photograph and three supporting points. */
export function PointsBand({
  id,
  eyebrow,
  title,
  lead,
  points,
  slot,
  surface = "deep",
}: {
  id: string;
  eyebrow: string;
  title: string;
  lead: string;
  points: readonly Point[];
  slot: MediaId;
  surface?: Surface;
}) {
  return (
    <Section surface={surface} id={id} ariaLabelledBy={`${id}-title`}>
      <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="flex flex-col gap-6 lg:col-span-7">
          <Reveal y={10}>
            <Eyebrow>{eyebrow}</Eyebrow>
          </Reveal>
          <RevealText as="h2" id={`${id}-title`} className="display-lg max-w-[14ch]">
            {title}
          </RevealText>
          <Reveal>
            <p className="lead max-w-[56ch]">{lead}</p>
          </Reveal>
          <Reveal as="ol" staggerChildren className="mt-4 grid gap-px overflow-hidden rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3">
            {points.map((p, i) => (
              <li key={p.title} className="flex flex-col gap-3 bg-[var(--surface)] p-6">
                <Index n={i + 1} />
                <h3 className="title-sm">{p.title}</h3>
                <p className="small">{p.text}</p>
              </li>
            ))}
          </Reveal>
        </div>
        <div className="lg:col-span-5">
          <Plate slot={slot} sizes="(max-width: 1024px) 100vw, 40vw" className="steel-edge lg:sticky lg:top-[calc(var(--nav-h)+2rem)]" radius="var(--radius-panel)" scrim="bottom" />
        </div>
      </div>
    </Section>
  );
}
