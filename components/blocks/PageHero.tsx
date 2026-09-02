import { Plate } from "@/components/ui/Plate";
import { Button } from "@/components/ui/Button";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/ui/Primitives";
import type { MediaId } from "@/lib/media";

/** Inner-page hero: photograph, scrims, eyebrow, H1, lead, up to two actions. */
export function PageHero({
  id = "hero",
  eyebrow,
  title,
  lead,
  slot,
  primary,
  secondary,
  compact = false,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  lead: string;
  slot: MediaId;
  primary?: { href: string; label: string; external?: boolean };
  secondary?: { href: string; label: string; external?: boolean };
  compact?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <section
      id={id}
      data-section={id}
      data-surface="deep"
      aria-labelledby={`${id}-title`}
      className={`relative isolate flex flex-col justify-end overflow-hidden bg-[var(--surface)] text-[var(--text-hi)] ${compact ? "min-h-[64svh]" : "min-h-[82svh]"}`}
    >
      <div className="absolute inset-0 -z-10">
        <Plate slot={slot} sizes="100vw" priority aspect="fill" parallax={8} reveal={false} overscan={1.12} dim={0.86} className="!absolute inset-0 h-full w-full" />
        <div aria-hidden className="absolute inset-0 scrim-left opacity-90" />
        <div aria-hidden className="absolute inset-0 scrim-bottom" />
        <div aria-hidden className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[rgba(4,7,13,0.55)] to-transparent" />
      </div>
      <div className="shell relative z-10 flex flex-col gap-6 pb-[clamp(2.5rem,6vh,4.5rem)] pt-[calc(var(--nav-h)+4rem)]">
        <Reveal immediate delay={0.1} y={10}>
          <Eyebrow>{eyebrow}</Eyebrow>
        </Reveal>
        <RevealText as="h1" id={`${id}-title`} immediate delay={0.2} className="display-lg max-w-[15ch]">
          {title}
        </RevealText>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-end">
          <Reveal immediate delay={0.6} y={16}>
            <p className="lead max-w-[56ch]">{lead}</p>
          </Reveal>
          {(primary || secondary) && (
            <Reveal immediate delay={0.75} y={16} className="flex flex-wrap gap-3 lg:justify-end">
              {primary && (
                <Button href={primary.href} external={primary.external}>
                  {primary.label}
                </Button>
              )}
              {secondary && (
                <Button href={secondary.href} variant="glass" external={secondary.external}>
                  {secondary.label}
                </Button>
              )}
            </Reveal>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}
