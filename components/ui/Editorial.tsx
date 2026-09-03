import type { ReactNode } from "react";
import clsx from "clsx";
import { Plate, type Grade } from "@/components/ui/Plate";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { LightSweep } from "@/components/ui/LightSweep";
import { Section, SectionHead, SectionMark, SpecStrip, Lines, type Surface, type SpecItem, type HeadPattern } from "@/components/ui/Primitives";
import type { MediaId } from "@/lib/media";

export type EditorialMedia = {
  slot: MediaId;
  sizes?: string;
  aspect?: number;
  grade?: Grade;
  /** Small caption set inside the frame's foot. */
  caption?: string;
};

export type Action = { href: string; label: string; variant?: "metal" | "steel" | "ink" | "link"; external?: boolean };

export type LedgerRow = { title: string; text: string; index?: string | number; meta?: string };

type Props = {
  id: string;
  surface?: Surface;
  layout: "feature" | "statement" | "plate" | "ledger";
  /** Section mark: "02 / CAR SHIPPING". */
  mark?: { index: string | number; label: string };
  eyebrow?: string;
  title: string | readonly string[];
  lead?: string;
  head?: HeadPattern;
  media?: EditorialMedia;
  inset?: EditorialMedia;
  /** Any drawn graphic (a Blueprint view, a map) that stands in for media. */
  graphic?: ReactNode;
  flip?: boolean;
  specs?: readonly SpecItem[];
  bullets?: readonly string[];
  actions?: readonly Action[];
  rows?: readonly LedgerRow[];
  /** Ledger rows draw a route hairline down their left edge. */
  route?: boolean;
  children?: ReactNode;
  className?: string;
  tight?: boolean;
};

/**
 * The editorial system. One block, four layouts, so secondary sections stay
 * consistent without ever looking identical:
 *  feature   — asymmetric 7/5 with media overlapping the shell edge, optional inset
 *  statement — full-bleed photograph with the heading set inside it, spec plate below
 *  plate     — a machined graphite plate carrying specs beside a drawn graphic
 *  ledger    — numbered hairline rows beside an editorial head
 */
export function Editorial(props: Props) {
  const { layout } = props;
  if (layout === "statement") return <Statement {...props} />;
  if (layout === "plate") return <PlateLayout {...props} />;
  if (layout === "ledger") return <Ledger {...props} />;
  return <Feature {...props} />;
}

/* ------------------------------------------------------------------ pieces */

function Actions({ actions }: { actions?: readonly Action[] }) {
  if (!actions?.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-3 pt-2">
      {actions.map((a, i) => (
        <Button key={a.href + a.label} href={a.href} external={a.external} variant={a.variant ?? (i === 0 ? "metal" : "steel")}>
          {a.label}
        </Button>
      ))}
    </div>
  );
}

function Bullets({ bullets }: { bullets?: readonly string[] }) {
  if (!bullets?.length) return null;
  return (
    <ul role="list" className="flex flex-col divide-y divide-[var(--line)] border-y border-[var(--line)]">
      {bullets.map((b, i) => (
        <li key={b} className="grid grid-cols-[2.4rem_1fr] items-baseline gap-4 py-3">
          <span className="numeral text-[var(--step--2)] tracking-[0.12em] text-[var(--text-low)]">{String(i + 1).padStart(2, "0")}</span>
          <span className="body !text-[var(--text-hi)]">{b}</span>
        </li>
      ))}
    </ul>
  );
}

function Media({ m, className, priority = false, parallax = 8 }: { m: EditorialMedia; className?: string; priority?: boolean; parallax?: number }) {
  return (
    <div className={clsx("relative", className)}>
      <Plate
        slot={m.slot}
        sizes={m.sizes ?? "(max-width: 1024px) 100vw, 58vw"}
        aspect={m.aspect}
        grade={m.grade}
        priority={priority}
        parallax={parallax}
        radius="var(--radius-panel)"
        className="steel-edge"
        scrim={m.caption ? "bottom" : "none"}
      >
        {m.caption && (
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 lg:p-6">
            <span className="spec !text-[var(--text-hi)] drop-shadow-[0_1px_0_rgba(0,0,0,.6)]">{m.caption}</span>
            <span aria-hidden className="h-px w-16 bg-[rgba(179,212,255,0.6)]" />
          </div>
        )}
      </Plate>
    </div>
  );
}

/* ----------------------------------------------------------------- feature */

function Feature({ id, surface = "navy", mark, eyebrow, title, lead, head = "editorial", media, inset, graphic, flip, specs, bullets, actions, children, className, tight }: Props) {
  const visual = graphic ? (
    <div className="relative">{graphic}</div>
  ) : media ? (
    <div className={clsx("relative", flip ? "lg:-mr-[3vw]" : "lg:-ml-[3vw]")}>
      <Media m={media} />
      {inset && (
        <div className={clsx("absolute w-[38%] max-w-[300px]", flip ? "-left-6 bottom-[-12%] lg:-left-10" : "-right-6 bottom-[-12%] lg:-right-10")}>
          <Plate slot={inset.slot} sizes="(max-width: 1024px) 40vw, 22vw" aspect={inset.aspect ?? 4 / 5} grade={inset.grade} parallax={4} radius="var(--radius-card)" className="steel-edge ring-1 ring-[var(--line-strong)]" />
        </div>
      )}
    </div>
  ) : null;

  return (
    <Section surface={surface} id={id} ariaLabelledBy={`${id}-title`} head={head} className={clsx("overflow-clip", className)} tight={tight}>
      <div className="shell grid items-center gap-12 lg:grid-cols-12 lg:gap-14">
        <div className={clsx("relative lg:col-span-7", flip ? "lg:order-2" : "lg:order-1", inset && "mb-[10%] lg:mb-0")}>
          {visual}
        </div>
        <div className={clsx("flex flex-col gap-7 lg:col-span-5", flip ? "lg:order-1" : "lg:order-2")}>
          <div className="flex flex-col gap-5">
            {head === "index" ? (
              <SectionHead pattern="index" index={mark?.index} mark={mark} eyebrow={eyebrow} title={<Lines text={title} />} id={`${id}-title`} />
            ) : (
              <>
                {mark ? <SectionMark index={mark.index} label={mark.label} /> : eyebrow && <span className="eyebrow">{eyebrow}</span>}
                <RevealText as="h2" id={`${id}-title`} className="display-md max-w-[16ch]">
                  <Lines text={title} />
                </RevealText>
              </>
            )}
            {lead && (
              <Reveal>
                <p className="lead max-w-[46ch]">{lead}</p>
              </Reveal>
            )}
          </div>
          {bullets && (
            <Reveal>
              <Bullets bullets={bullets} />
            </Reveal>
          )}
          {specs && (
            <Reveal>
              <SpecStrip items={specs} layout="row" tone="quiet" />
            </Reveal>
          )}
          {children}
          {actions && (
            <Reveal>
              <Actions actions={actions} />
            </Reveal>
          )}
        </div>
      </div>
    </Section>
  );
}

/* --------------------------------------------------------------- statement */

function Statement({ id, surface = "deep", mark, eyebrow, title, lead, media, specs, actions, children, className }: Props) {
  return (
    <Section surface={surface} id={id} ariaLabelledBy={`${id}-title`} head="caption" flush className={clsx("overflow-clip", className)}>
      <div className="relative min-h-[76svh] lg:min-h-[86svh]">
        {media && (
          <Plate slot={media.slot} sizes="100vw" aspect="fill" grade={media.grade ?? "deep"} parallax={10} reveal={false} overscan={1.12} dim={0.92} className="!absolute inset-0 h-full w-full" />
        )}
        <div aria-hidden className="absolute inset-0 scrim-left-soft" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-[60%] scrim-bottom" />
        <div aria-hidden className="pointer-events-none absolute inset-0 guides opacity-60" />
        <div className="shell relative z-10 flex min-h-[76svh] flex-col justify-end gap-10 py-[clamp(4rem,8vw,7rem)] lg:min-h-[86svh]">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="flex flex-col gap-5 lg:col-span-7">
              {mark ? <SectionMark index={mark.index} label={mark.label} /> : eyebrow && <span className="eyebrow">{eyebrow}</span>}
              <RevealText as="h2" id={`${id}-title`} className="display-lg max-w-[14ch]">
                <Lines text={title} />
              </RevealText>
              {lead && (
                <Reveal>
                  <p className="lead max-w-[48ch]">{lead}</p>
                </Reveal>
              )}
              {actions && (
                <Reveal>
                  <Actions actions={actions} />
                </Reveal>
              )}
            </div>
            {specs && (
              <Reveal className="plate plate-steel relative overflow-hidden p-6 lg:col-span-4 lg:col-start-9 lg:p-7">
                <LightSweep trigger="inview" />
                <SpecStrip items={specs} layout="list" tone="quiet" />
              </Reveal>
            )}
          </div>
          {children}
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------- plate */

function PlateLayout({ id, surface = "graphite", mark, eyebrow, title, lead, head = "editorial", graphic, media, specs, bullets, actions, children, className, flip, tight }: Props) {
  const visual = graphic ?? (media ? <Media m={media} parallax={5} /> : null);
  return (
    <Section surface={surface} id={id} ariaLabelledBy={`${id}-title`} head={head} className={className} tight={tight}>
      <div className="shell">
        <div className="plate plate-steel relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0 guides" />
          <LightSweep trigger="inview" />
          <div className="relative grid gap-10 p-6 sm:p-8 lg:grid-cols-12 lg:gap-12 lg:p-12">
            <div className={clsx("flex flex-col gap-7 lg:col-span-5", flip && "lg:order-2")}>
              {head === "index" ? (
                <SectionHead pattern="index" index={mark?.index} mark={mark} eyebrow={eyebrow} title={<Lines text={title} />} lead={lead} id={`${id}-title`} />
              ) : (
                <div className="flex flex-col gap-5">
                  {mark ? <SectionMark index={mark.index} label={mark.label} /> : eyebrow && <span className="eyebrow">{eyebrow}</span>}
                  <RevealText as="h2" id={`${id}-title`} className="display-md max-w-[14ch]">
                    <Lines text={title} />
                  </RevealText>
                  {lead && (
                    <Reveal>
                      <p className="lead max-w-[44ch]">{lead}</p>
                    </Reveal>
                  )}
                </div>
              )}
              {specs && (
                <Reveal>
                  <SpecStrip items={specs} layout="list" tone="quiet" />
                </Reveal>
              )}
              {bullets && (
                <Reveal>
                  <Bullets bullets={bullets} />
                </Reveal>
              )}
              {actions && (
                <Reveal>
                  <Actions actions={actions} />
                </Reveal>
              )}
            </div>
            <div className={clsx("relative min-h-[240px] lg:col-span-7", flip && "lg:order-1")}>{visual}</div>
          </div>
          {children}
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ ledger */

function Ledger({ id, surface = "navy", mark, eyebrow, title, lead, head = "stack", rows = [], route = true, actions, children, className, tight }: Props) {
  return (
    <Section surface={surface} id={id} ariaLabelledBy={`${id}-title`} head={head} className={className} tight={tight}>
      <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-14">
        <div className="flex flex-col gap-6 lg:col-span-4">
          <SectionHead pattern={head === "index" ? "index" : "stack"} index={mark?.index} mark={mark} eyebrow={eyebrow} title={<Lines text={title} />} lead={lead} id={`${id}-title`} size="sm" />
          {actions && <Actions actions={actions} />}
        </div>
        <div className="relative lg:col-span-8">
          {route && <div aria-hidden className="absolute bottom-6 left-[2.2rem] top-6 hidden w-px bg-gradient-to-b from-transparent via-[rgba(179,212,255,0.45)] to-transparent lg:block" />}
          <Reveal as="ol" staggerChildren stagger={0.06} className="flex flex-col divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {rows.map((r, i) => (
              <li key={r.title} className="grid gap-4 py-7 sm:grid-cols-[4.5rem_1fr] lg:gap-8 lg:py-8">
                <span className="index-xl !text-[clamp(1.6rem,1.2rem+1.2vw,2.4rem)]" aria-hidden>
                  {String(r.index ?? i + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-2.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <h3 className="title">{r.title}</h3>
                    {r.meta && <span className="spec">{r.meta}</span>}
                  </div>
                  <p className="body max-w-[62ch]">{r.text}</p>
                </div>
              </li>
            ))}
          </Reveal>
          {children}
        </div>
      </div>
    </Section>
  );
}
