import { Plate } from "@/components/ui/Plate";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { Eyebrow, PhoneLink } from "@/components/ui/Primitives";
import { InquiryForm, type Lane } from "@/components/forms/InquiryForm";
import { COMPANY, ADDRESS_LINES } from "@/lib/site";
import type { MediaId } from "@/lib/media";

/** A form beside its rationale, over a dimmed photograph. */
export function FormSection({
  id,
  lane,
  eyebrow,
  title,
  lead,
  slot,
  aside,
}: {
  id: string;
  lane: Lane;
  eyebrow: string;
  title: string;
  lead: string;
  slot?: MediaId;
  aside?: readonly { title: string; text: string }[];
}) {
  return (
    <section id={id} data-section={id} data-surface="deep" aria-labelledby={`${id}-title`} className="relative isolate overflow-hidden bg-[var(--surface)] text-[var(--text-hi)] py-[clamp(4.5rem,9vw,9rem)]">
      {slot && (
        <div className="absolute inset-0 -z-10">
          <Plate slot={slot} sizes="100vw" aspect="fill" parallax={8} reveal={false} dim={0.5} className="!absolute inset-0 h-full w-full" />
          <div aria-hidden className="absolute inset-0 scrim-full" />
          <div aria-hidden className="absolute inset-0 scrim-left" />
        </div>
      )}
      <div className="shell grid gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="flex flex-col gap-6 lg:col-span-5">
          <Reveal y={10}>
            <Eyebrow>{eyebrow}</Eyebrow>
          </Reveal>
          <RevealText as="h2" id={`${id}-title`} className="display-md max-w-[14ch]">
            {title}
          </RevealText>
          <Reveal>
            <p className="lead">{lead}</p>
          </Reveal>
          {aside && (
            <Reveal as="dl" staggerChildren className="mt-2 flex flex-col divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {aside.map((a) => (
                <div key={a.title} className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                  <dt className="label pt-1">{a.title}</dt>
                  <dd className="body">{a.text}</dd>
                </div>
              ))}
            </Reveal>
          )}
          <Reveal className="mt-2 flex flex-col gap-1 small">
            <span className="font-medium text-[var(--text-hi)]">{COMPANY.legalName}</span>
            <span>{ADDRESS_LINES.join(", ")}</span>
            <PhoneLink className="link-underline w-fit text-[var(--text-hi)]" />
          </Reveal>
        </div>
        <div className="lg:col-span-7">
          <InquiryForm lane={lane} />
        </div>
      </div>
    </section>
  );
}
