import { Plate } from "@/components/ui/Plate";
import { Button } from "@/components/ui/Button";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { PhoneLink } from "@/components/ui/Primitives";
import { CTA, COMPANY } from "@/lib/site";
import type { MediaId } from "@/lib/media";

/** The closing conversion band: full-bleed photograph, one line, two actions, the phone. */
export function CTABand({
  id = "cta",
  title,
  text,
  slot,
  primary = CTA.quote,
  secondary = CTA.oem,
}: {
  id?: string;
  title: string;
  text: string;
  slot: MediaId;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string } | null;
}) {
  return (
    <section id={id} data-section={id} data-surface="deep" aria-labelledby={`${id}-title`} className="relative isolate overflow-hidden bg-[var(--surface)] text-[var(--text-hi)]">
      <div className="absolute inset-0 -z-10">
        <Plate slot={slot} sizes="100vw" aspect="fill" parallax={10} reveal={false} dim={0.72} className="!absolute inset-0 h-full w-full" />
        <div aria-hidden className="absolute inset-0 scrim-full" />
        <div aria-hidden className="absolute inset-0 scrim-bottom" />
      </div>
      <div className="shell flex min-h-[70svh] flex-col items-start justify-end gap-7 py-[clamp(4rem,10vw,8rem)]">
        <RevealText as="h2" id={`${id}-title`} className="display-lg max-w-[14ch]">
          {title}
        </RevealText>
        <Reveal>
          <p className="lead max-w-[46ch]">{text}</p>
        </Reveal>
        <Reveal className="flex flex-wrap items-center gap-3 pt-1">
          <Button href={primary.href}>{primary.label}</Button>
          {secondary && (
            <Button href={secondary.href} variant="glass">
              {secondary.label}
            </Button>
          )}
        </Reveal>
        <Reveal className="flex items-center gap-3 small">
          <span className="text-[var(--text-low)]">Or call</span>
          <PhoneLink className="link-underline font-medium text-[var(--text-hi)]" />
          <span className="text-[var(--text-low)]">· {COMPANY.city}, {COMPANY.state}</span>
        </Reveal>
      </div>
    </section>
  );
}
