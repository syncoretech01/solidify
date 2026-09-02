import { Button } from "@/components/ui/Button";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { Section, PhoneLink } from "@/components/ui/Primitives";
import { CTA } from "@/lib/site";

/** A closing band without a photograph: deep navy, a gathering glow, one line, two actions. */
export function SimpleCTA({
  id = "cta",
  title,
  text,
  primary = CTA.quote,
  secondary = CTA.oem,
}: {
  id?: string;
  title: string;
  text: string;
  primary?: { href: string; label: string; external?: boolean };
  secondary?: { href: string; label: string; external?: boolean } | null;
}) {
  return (
    <Section surface="deep" id={id} ariaLabelledBy={`${id}-title`} className="overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[70vw] w-[70vw] max-w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl [background:radial-gradient(closest-side,rgba(47,107,255,0.18),transparent_70%)]" />
      <div className="shell relative flex flex-col items-start gap-7">
        <RevealText as="h2" id={`${id}-title`} className="display-lg max-w-[14ch]">
          {title}
        </RevealText>
        <Reveal>
          <p className="lead max-w-[48ch]">{text}</p>
        </Reveal>
        <Reveal className="flex flex-wrap items-center gap-3 pt-1">
          <Button href={primary.href} external={primary.external}>
            {primary.label}
          </Button>
          {secondary && (
            <Button href={secondary.href} variant="ghost" external={secondary.external}>
              {secondary.label}
            </Button>
          )}
        </Reveal>
        <Reveal className="small flex items-center gap-2">
          <span className="text-[var(--text-low)]">Or call</span>
          <PhoneLink className="link-underline font-medium text-[var(--text-hi)]" />
        </Reveal>
      </div>
    </Section>
  );
}
