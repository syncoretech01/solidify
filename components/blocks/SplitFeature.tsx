import clsx from "clsx";
import { Plate } from "@/components/ui/Plate";
import { Button } from "@/components/ui/Button";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { Section, Eyebrow, type Surface } from "@/components/ui/Primitives";
import type { MediaId } from "@/lib/media";

/** Image panel beside editorial copy. `flip` puts the image on the right. */
export function SplitFeature({
  id,
  eyebrow,
  title,
  text,
  bullets,
  href,
  cta,
  slot,
  flip = false,
  surface = "navy",
  aspect = 4 / 5,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  bullets?: readonly string[];
  href?: string;
  cta?: string;
  slot: MediaId;
  flip?: boolean;
  surface?: Surface;
  aspect?: number;
  children?: React.ReactNode;
}) {
  return (
    <Section surface={surface} id={id} ariaLabelledBy={`${id}-title`}>
      <div className={clsx("shell grid items-center gap-10 lg:grid-cols-12 lg:gap-16")}>
        <div className={clsx("lg:col-span-6", flip && "lg:order-2")}>
          <Plate slot={slot} sizes="(max-width: 1024px) 100vw, 50vw" aspect={aspect} className="steel-edge" radius="var(--radius-panel)" scrim="bottom" />
        </div>
        <div className={clsx("flex flex-col gap-6 lg:col-span-5", flip ? "lg:order-1 lg:col-start-1" : "lg:col-start-8")}>
          <Reveal y={10}>
            <Eyebrow>{eyebrow}</Eyebrow>
          </Reveal>
          <RevealText as="h2" id={`${id}-title`} className="display-md max-w-[16ch]">
            {title}
          </RevealText>
          <Reveal>
            <p className="lead">{text}</p>
          </Reveal>
          {bullets && (
            <Reveal as="ul" staggerChildren className="flex flex-col gap-3 pt-1" stagger={0.06}>
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-[var(--text-mid)]">
                  <span aria-hidden className="mt-[0.62em] h-px w-5 flex-none bg-[var(--accent)]" />
                  <span>{b}</span>
                </li>
              ))}
            </Reveal>
          )}
          {children}
          {href && cta && (
            <Reveal className="pt-2">
              <Button href={href} variant="ghost">
                {cta}
              </Button>
            </Reveal>
          )}
        </div>
      </div>
    </Section>
  );
}
