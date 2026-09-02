import { Button } from "@/components/ui/Button";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { Section, Eyebrow } from "@/components/ui/Primitives";
import { COMPENSATION, INSURANCE } from "@/lib/site";

/** A restrained owner-operator pathway — one module, never the page's subject. */
export function OperatorBand({ eyebrow, title, text, href, cta }: { eyebrow: string; title: string; text: string; href: string; cta: string }) {
  const facts = [
    { k: "Compensation", v: COMPENSATION.basisShort },
    { k: "Payment terms", v: COMPENSATION.terms },
    { k: "Cargo insurance", v: `${INSURANCE.requirements[0].limit} minimum` },
  ];
  return (
    <Section surface="gunmetal" id="operators" ariaLabelledBy="operators-title" tight>
      <div className="shell grid items-center gap-10 lg:grid-cols-12">
        <div className="flex flex-col gap-5 lg:col-span-7">
          <Reveal y={10}>
            <Eyebrow>{eyebrow}</Eyebrow>
          </Reveal>
          <RevealText as="h2" id="operators-title" className="display-sm max-w-[22ch]">
            {title}
          </RevealText>
          <Reveal>
            <p className="body max-w-[58ch]">{text}</p>
          </Reveal>
          <Reveal className="pt-1">
            <Button href={href} variant="ghost">
              {cta}
            </Button>
          </Reveal>
        </div>
        <Reveal as="dl" staggerChildren className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--line)] lg:col-span-5">
          {facts.map((f) => (
            <div key={f.k} className="flex flex-col gap-1 bg-[var(--surface-raised)] px-5 py-4">
              <dt className="label">{f.k}</dt>
              <dd className="font-display text-[var(--step-1)] font-semibold">{f.v}</dd>
            </div>
          ))}
        </Reveal>
      </div>
    </Section>
  );
}
