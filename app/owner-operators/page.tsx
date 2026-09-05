import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata, breadcrumbLd, faqLd } from "@/lib/seo";
import { COMPENSATION, INSURANCE, CLAIMS } from "@/lib/site";
import { JsonLd } from "@/components/layout/JsonLd";
import { PageHero } from "@/components/blocks/PageHero";
import { Road } from "@/components/operators/Road";
import { ApplicationRoute, ApplyPanel } from "@/components/operators/Apply";
import { Editorial } from "@/components/ui/Editorial";
import { Faq, type FaqItem } from "@/components/blocks/Faq";
import { Closing } from "@/components/layout/Closing";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHead, Lines } from "@/components/ui/Primitives";
import { Onboarding } from "@/components/onboarding/Onboarding";

/**
 * /owner-operators — the page for people who own their Truck / Power Unit.
 *
 * It runs the whole relationship end to end and is the ONLY page that leaves
 * the domain: the application route explains the seven stages, the application
 * panel opens the external portal, and secure onboarding for approved
 * operators sits further down the same page. Drivers who would run Solidify's
 * own equipment are a different audience and have their own page.
 */

export const metadata: Metadata = pageMetadata({
  title: "Owner-Operators — Run Your Truck With an Auto Transport Carrier",
  description:
    "Run your Truck / Power Unit with Solidify Transport, an auto transport motor carrier. Compensation based on a percentage of line-haul revenue, Net 30 terms, all 48 contiguous states with strong Western-US coverage. Apply, then complete secure onboarding.",
  path: "/owner-operators",
});

const holder = INSURANCE.certificateHolder.join(", ");

const REQUIREMENTS = [
  {
    index: 1,
    title: "Your Truck / Power Unit and licensing",
    meta: "Equipment",
    text: "The VIN, year, make and model of your Truck / Power Unit, your licensing details, and the service areas you want to run.",
  },
  {
    index: 2,
    title: "Cargo insurance — $500,000 minimum",
    meta: "Insurance",
    text: `The certificate is sent from your insurance agent and must show ${holder} as certificate holder and additional insured.`,
  },
  {
    index: 3,
    title: "Commercial automobile liability — $1,000,000 combined single limit",
    meta: "Insurance",
    text: "Carried continuously while you run with the carrier.",
  },
  {
    index: 4,
    title: "General liability — $1,000,000 each occurrence, $1,000,000 aggregate",
    meta: "Insurance",
    text: "Shown on the same certificate as the cover above.",
  },
  {
    index: 5,
    title: "W-9 and direct deposit details",
    meta: "Paperwork",
    text: "Completed once you are approved, through secure onboarding on this page — not on the application portal.",
  },
];

const FAQ: readonly FaqItem[] = [
  { q: "How am I paid?", a: `${COMPENSATION.basis} Payment terms are ${COMPENSATION.terms}.` },
  {
    q: "What insurance do I need?",
    a: `Cargo at $500,000 minimum; commercial automobile liability at $1,000,000 combined single limit; general liability at $1,000,000 each occurrence and $1,000,000 general aggregate. The certificate is sent from your insurance agent and must show ${holder} as certificate holder and additional insured.`,
  },
  {
    q: "How do I apply?",
    a: "Start with the application section on this page. It says what you need to hand first, then opens the external driver application portal in a new tab.",
  },
  {
    q: "What is the onboarding form for?",
    a: "Once you are approved, Solidify gives you an access code. You use it on this page to complete your operator profile, equipment and licensing details, insurance certificates, W-9 and direct-deposit authorization securely online.",
  },
  {
    q: "Is my banking and tax information secure?",
    a: "Onboarding runs over an encrypted connection and is delivered directly to Solidify Transport. This website does not keep a copy of your submission, and nothing is saved in your browser. Sensitive values are masked on screen.",
  },
  {
    q: "I do not own a truck. Can I still drive?",
    a: "Yes — that is a different route. The Become a Driver page covers driving Solidify's own equipment, and the carrier follows up with you directly.",
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
        primary={{ href: "#apply", label: "Start your application" }}
        secondary={{ href: "#onboarding", label: "Approved? Begin onboarding" }}
        specs={[
          { label: "Compensation", value: COMPENSATION.basisShort },
          { label: "Terms", value: COMPENSATION.terms },
          { label: "Coverage", value: CLAIMS.coverage },
        ]}
      />

      <Road />

      <Editorial
        id="requirements"
        layout="ledger"
        surface="graphite"
        head="editorial"
        mark={{ index: 2, label: "What you need" }}
        title={["Before you", "apply."]}
        lead="Have these ready. The insurance limits and the certificate holder below are exactly what the carrier requires."
        rows={REQUIREMENTS}
        route
      />

      <ApplicationRoute />

      <ApplyPanel />

      {/* Secure onboarding — stage 06, on the same page, isolated region */}
      <Section surface="navy" id="onboarding" ariaLabelledBy="onboarding-title" head="index">
        <div aria-hidden className="pointer-events-none absolute inset-0 guides opacity-40" />
        <div className="shell relative flex flex-col gap-10">
          <div className="flex flex-col gap-6">
            <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-10">
              <div className="lg:col-span-7">
                <SectionHead
                  pattern="index"
                  index={5}
                  mark={{ index: 5, label: "Stage 06 · onboarding" }}
                  title={<Lines text={["Secure", "onboarding."]} />}
                  id="onboarding-title"
                />
              </div>
              <Reveal className="lg:col-span-5 lg:justify-self-end">
                <p className="lead lg:max-w-[38ch]">
                  Six steps: profile, equipment and licensing, insurance, W-9, direct deposit, review. Sent over an encrypted connection and delivered directly to Solidify Transport. This website does not keep a copy, and nothing is saved in your browser.
                </p>
                <p className="spec mt-3">Encrypted · Delivered to Solidify · No copy kept</p>
              </Reveal>
            </div>
            <p className="small">
              You need an access code from Solidify to use this form. Not approved yet?{" "}
              <Link href="#apply" className="link-underline font-medium text-[var(--text-hi)]">
                Start your application
              </Link>{" "}
              first.
            </p>
          </div>
          <Onboarding />
        </div>
      </Section>

      <Faq mark={{ index: 6, label: "Questions" }} title="Questions from owner-operators" items={FAQ} surface="graphite" />

      <Closing
        title={["Run with", "the carrier."]}
        lead="Start your application, and complete onboarding here once you are approved."
        primary={{ href: "#apply", label: "Start your application" }}
        secondary={{ href: "/become-a-driver", label: "I do not own a truck" }}
        slot="oo-closing"
      />
    </>
  );
}
