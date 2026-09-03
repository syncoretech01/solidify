import type { Metadata } from "next";
import { pageMetadata, breadcrumbLd, faqLd } from "@/lib/seo";
import { APPLY_URL, COMPENSATION, INSURANCE } from "@/lib/site";
import { JsonLd } from "@/components/layout/JsonLd";
import { PageHero } from "@/components/blocks/PageHero";
import { Road } from "@/components/operators/Road";
import { Paths } from "@/components/operators/Paths";
import { Faq, type FaqItem } from "@/components/blocks/Faq";
import { Closing } from "@/components/layout/Closing";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHead, ApplyLink, Lines } from "@/components/ui/Primitives";
import { Onboarding } from "@/components/onboarding/Onboarding";

export const metadata: Metadata = pageMetadata({
  title: "Owner-Operators — Drive With an Auto Transport Carrier",
  description:
    "Run your Truck / Power Unit with Solidify Transport, an auto transport motor carrier. Compensation based on a percentage of line-haul revenue, Net 30 terms, all 48 contiguous states with strong Western-US coverage. Apply, then complete secure onboarding.",
  path: "/owner-operators",
});

const holder = INSURANCE.certificateHolder.join(", ");

const FAQ: readonly FaqItem[] = [
  { q: "How am I paid?", a: `${COMPENSATION.basis} Payment terms are ${COMPENSATION.terms}.` },
  {
    q: "What insurance do I need?",
    a: `Cargo at $500,000 minimum; commercial automobile liability at $1,000,000 combined single limit; general liability at $1,000,000 each occurrence and $1,000,000 general aggregate. The certificate is sent from your insurance agent and must show ${holder} as certificate holder and additional insured.`,
  },
  { q: "How do I apply?", a: "New applications go through our driver portal — use the Start a new application button on this page. It opens in a new tab." },
  {
    q: "What is the onboarding form for?",
    a: "Once you are approved, Solidify gives you an access code. You use it on this page to complete your operator profile, equipment and licensing details, insurance certificates, W-9 and direct-deposit authorization securely online.",
  },
  {
    q: "Is my banking and tax information secure?",
    a: "Onboarding runs over an encrypted connection to Solidify's own server-side application, is stored encrypted at rest, is never emailed, and is never saved in your browser. Sensitive values are masked on screen.",
  },
  { q: "Where will I run?", a: "Solidify moves vehicles across all 48 contiguous states, with strong Western-US coverage." },
];

export default function OwnerOperatorsPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Owner Operators", path: "/owner-operators" },
          ]),
          faqLd([...FAQ]),
        ]}
      />
      <PageHero
        mark={{ index: 1, label: "Owner-operators" }}
        title={["Run your Truck /", "Power Unit with an", "auto transport carrier."]}
        lead={`${COMPENSATION.basis} Payment terms are ${COMPENSATION.terms}. Vehicle loads across all 48 contiguous states, with strong Western-US coverage.`}
        slot="oo-hero"
        grade="deep"
        primary={{ href: APPLY_URL, label: "Start a new application", external: true }}
        secondary={{ href: "#onboarding", label: "Approved? Begin onboarding" }}
        specs={[
          { label: "Compensation", value: COMPENSATION.basisShort },
          { label: "Terms", value: COMPENSATION.terms },
          { label: "Coverage", value: "All 48 contiguous states" },
        ]}
      />

      <Road />

      <Paths />

      {/* Secure onboarding — same page, isolated region */}
      <Section surface="graphite" id="onboarding" ariaLabelledBy="onboarding-title" head="index">
        <div aria-hidden className="pointer-events-none absolute inset-0 guides opacity-40" />
        <div className="shell relative flex flex-col gap-10">
          <div className="flex flex-col gap-6">
            <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-10">
              <div className="lg:col-span-7">
                <SectionHead pattern="index" index={4} mark={{ index: 4, label: "Approved operators" }} title={<Lines text={["Secure", "onboarding."]} />} id="onboarding-title" />
              </div>
              <Reveal className="lg:col-span-5 lg:justify-self-end">
                <p className="lead lg:max-w-[38ch]">
                  Six steps: profile, equipment and licensing, insurance, W-9, direct deposit, review. Submitted over an encrypted connection to Solidify&apos;s own application, stored encrypted, never emailed, never saved in your browser.
                </p>
                <p className="spec mt-3">Encrypted · Server-side · Never emailed</p>
              </Reveal>
            </div>
            <p className="small">
              Not approved yet? <ApplyLink className="link-underline font-medium text-[var(--text-hi)]">Start a new application</ApplyLink> first — this form is for operators who already have an access code.
            </p>
          </div>
          <Onboarding />
        </div>
      </Section>

      <Faq mark={{ index: 5, label: "Questions" }} title="Questions from owner-operators" items={FAQ} surface="navy" />
      <Closing
        title={["Run with", "the carrier."]}
        lead="Apply through the driver portal, and complete onboarding here once approved."
        primary={{ href: APPLY_URL, label: "Start a new application", external: true }}
        secondary={{ href: "/contact?lane=operator", label: "Ask a question first" }}
        slot="closing"
      />
    </>
  );
}
