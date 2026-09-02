import type { Metadata } from "next";
import { pageMetadata, breadcrumbLd, faqLd } from "@/lib/seo";
import { APPLY_URL, COMPENSATION, INSURANCE, CTA } from "@/lib/site";
import { JsonLd } from "@/components/layout/JsonLd";
import { PageHero } from "@/components/blocks/PageHero";
import { SplitFeature } from "@/components/blocks/SplitFeature";
import { CardGrid } from "@/components/blocks/CardGrid";
import { Faq, type FaqItem } from "@/components/blocks/Faq";
import { SimpleCTA } from "@/components/blocks/SimpleCTA";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { Section, Eyebrow, Index, ApplyLink } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { Onboarding } from "@/components/onboarding/Onboarding";

export const metadata: Metadata = pageMetadata({
  title: "Owner-Operators — Drive With an Auto Transport Carrier",
  description:
    "Run your truck / power unit with Solidify Transport, an auto transport motor carrier. Compensation based on a percentage of line-haul revenue, Net 30 terms, all 48 contiguous states with Western US density. Apply, then complete secure onboarding.",
  path: "/owner-operators",
});

const WHY = [
  { title: "Paid a share of the line haul", text: COMPENSATION.basis, kicker: "Compensation" },
  { title: "Net 30 terms", text: `Payment terms are ${COMPENSATION.terms}. Not something you renegotiate load by load.`, kicker: "Payment" },
  { title: "Vehicle loads, only", text: "An auto transport carrier — the loads are vehicles for OEMs, dealerships and consumers.", kicker: "Cargo" },
  { title: "48 states, Western density", text: "Authority to move vehicles across the contiguous United States, with the deepest coverage across the Western states.", kicker: "Lanes" },
] as const;

const REQUIREMENTS = [
  { title: "Truck / power unit and trailer", text: "Documented by VIN, make, model, year and capacity during onboarding." },
  { title: "USDOT and MC numbers", text: "Your active operating numbers are recorded in your operator profile." },
  { title: "Insurance at the required limits", text: "Cargo, commercial automobile liability and general liability at the minimums below, with a certificate from your agent." },
  { title: "Tax and payment documents", text: "A completed W-9 and a direct-deposit authorization with a voided check, submitted through secure onboarding." },
] as const;

const FAQ: readonly FaqItem[] = [
  { q: "How am I paid?", a: `${COMPENSATION.basis} Payment terms are ${COMPENSATION.terms}.` },
  { q: "What insurance do I need?", a: "Cargo at $500,000 minimum; commercial automobile liability at $1,000,000 combined single limit; general liability at $1,000,000 each occurrence and $1,000,000 aggregate. The certificate must name Solidify Transport LLC, 2455 Naglee Rd. #314, Tracy, CA 95304 as certificate holder." },
  { q: "How do I apply?", a: "New applications go through our driver portal — use the Start a New Application button on this page. It opens in a new tab." },
  { q: "What is the onboarding form for?", a: "Once you are approved, Solidify gives you an access code. You use it on this page to complete your operator profile, equipment and licensing details, insurance certificates, W-9 and direct-deposit authorization securely online." },
  { q: "Is my banking and tax information secure?", a: "Onboarding runs over an encrypted connection to Solidify's own server-side application, is stored encrypted at rest, is never emailed, and is never saved in your browser. Sensitive values are masked on screen." },
  { q: "Where will I run?", a: "Solidify moves vehicles across all 48 contiguous states, with the strongest coverage in the Western states." },
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
        eyebrow="Owner-operators"
        title="Run your truck / power unit with an auto transport carrier."
        lead={`${COMPENSATION.basis} Payment terms are ${COMPENSATION.terms}. Vehicle loads across all 48 contiguous states, with the deepest coverage in the West.`}
        slot="oo-hero"
        primary={{ href: APPLY_URL, label: "Start a new application", external: true }}
        secondary={{ href: "#onboarding", label: "Approved? Begin onboarding" }}
      />

      <CardGrid id="why" eyebrow="Why run with Solidify" title="The terms of the relationship, stated plainly." items={WHY} columns={4} surface="navy" numbered={false} />

      <SplitFeature
        id="requirements"
        eyebrow="Requirements"
        title="What you bring."
        text="Solidify runs on qualified owner-operators. Before a vehicle moves under the carrier, these are in place."
        bullets={REQUIREMENTS.map((r) => `${r.title} — ${r.text}`)}
        slot="oo-equipment"
        surface="steel"
        aspect={16 / 10}
      />

      {/* Insurance minimums — confirmed limits, verbatim certificate holder */}
      <Section surface="deep" id="insurance" ariaLabelledBy="insurance-title">
        <div className="shell grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="flex flex-col gap-6 lg:col-span-5">
            <Reveal y={10}>
              <Eyebrow>Insurance minimums</Eyebrow>
            </Reveal>
            <RevealText as="h2" id="insurance-title" className="display-md max-w-[14ch]">
              Coverage every operator carries.
            </RevealText>
            <Reveal>
              <p className="lead">These limits are required before dispatch. Your insurance agent sends the certificate, naming Solidify Transport LLC as certificate holder.</p>
            </Reveal>
            <Reveal className="card flex flex-col gap-2 p-5">
              <span className="label">Certificate holder</span>
              {INSURANCE.certificateHolder.map((l) => (
                <span key={l} className="body !text-[var(--text-hi)]">
                  {l}
                </span>
              ))}
            </Reveal>
          </div>
          <Reveal as="dl" staggerChildren className="grid gap-px overflow-hidden rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:col-span-7">
            {INSURANCE.requirements.map((r) => (
              <div key={r.id} className="flex flex-col gap-2 bg-[var(--surface)] p-6 lg:p-7">
                <dt className="label">{r.label}</dt>
                <dd className="font-display text-[var(--step-3)] font-semibold leading-none tracking-[-0.02em]">{r.limit}</dd>
                <dd className="small">{r.note}</dd>
              </div>
            ))}
          </Reveal>
        </div>
      </Section>

      {/* Two paths — never conflated */}
      <Section surface="navy" id="paths" ariaLabelledBy="paths-title">
        <div className="shell flex flex-col gap-12">
          <div className="flex flex-col gap-5">
            <Reveal y={10}>
              <Eyebrow>Two paths</Eyebrow>
            </Reveal>
            <RevealText as="h2" id="paths-title" className="display-md max-w-[18ch]">
              New applicant, or already approved?
            </RevealText>
          </div>
          <Reveal staggerChildren className="grid gap-5 lg:grid-cols-2">
            <div className="card steel-edge flex flex-col gap-5 overflow-hidden">
              <Plate slot="oo-driver" sizes="(max-width: 1024px) 100vw, 50vw" aspect={16 / 9} scrim="bottom" parallax={6} />
              <div className="flex flex-1 flex-col gap-4 p-6 lg:p-8">
                <div className="flex items-center gap-3">
                  <Index n={1} />
                  <span className="label">New application</span>
                </div>
                <h3 className="title">Apply through the driver portal.</h3>
                <p className="body">New owner-operators apply through our external driver application. It opens in a new tab and asks for your operating, equipment and insurance details.</p>
                <div className="pt-2">
                  <Button href={APPLY_URL} external>
                    Start a new application
                  </Button>
                </div>
              </div>
            </div>
            <div className="card steel-edge flex flex-col gap-5 overflow-hidden">
              <div className="frame frame-reserved aspect-[16/9]" aria-hidden>
                <div className="absolute inset-0 flex items-end p-6">
                  <span className="glass rounded-md px-3 py-2 text-[var(--step--2)] tracking-[0.12em] text-[var(--text-mid)]">ENCRYPTED · SERVER-SIDE · NEVER EMAILED</span>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-4 p-6 lg:p-8">
                <div className="flex items-center gap-3">
                  <Index n={2} />
                  <span className="label">Approved · onboarding</span>
                </div>
                <h3 className="title">Complete secure onboarding here.</h3>
                <p className="body">Approved operators receive an access code from Solidify. Use it below to complete your profile, equipment and licensing, insurance certificates, W-9 and direct-deposit authorization.</p>
                <div className="pt-2">
                  <Button href="#onboarding" variant="ghost">
                    Begin onboarding
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Secure onboarding — same page, isolated region */}
      <Section surface="gunmetal" id="onboarding" ariaLabelledBy="onboarding-title">
        <div className="shell flex flex-col gap-10">
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="flex flex-col gap-4 lg:col-span-7">
              <Eyebrow>Approved operators</Eyebrow>
              <h2 id="onboarding-title" className="display-md max-w-[16ch]">
                Secure onboarding.
              </h2>
              <p className="lead">
                Six steps: profile, equipment and licensing, insurance, W-9, direct deposit, review. Submitted over an encrypted connection to Solidify&apos;s own application, stored encrypted, never emailed, never saved in your browser.
              </p>
            </div>
            <p className="small lg:col-span-5 lg:self-end">
              Not approved yet?{" "}
              <ApplyLink className="link-underline font-medium text-[var(--text-hi)]">Start a new application</ApplyLink> first — this form is for operators who already have an access code.
            </p>
          </div>
          <Onboarding />
        </div>
      </Section>

      <Faq title="Questions from owner-operators" items={FAQ} surface="navy" />
      <SimpleCTA title="Run with the carrier." text="Apply through the driver portal, and complete onboarding here once approved." primary={{ href: APPLY_URL, label: "Start a new application", external: true }} secondary={{ href: "/contact?lane=operator", label: "Ask a question first" }} />
      <span className="sr-only">{CTA.drive.label}</span>
    </>
  );
}
