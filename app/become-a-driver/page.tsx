import type { Metadata } from "next";
import { pageMetadata, breadcrumbLd, faqLd } from "@/lib/seo";
import { CLAIMS, COMPENSATION, INSURANCE, COMPANY } from "@/lib/site";
import { JsonLd } from "@/components/layout/JsonLd";
import { PageHero } from "@/components/blocks/PageHero";
import { Journey, PortalHandoff } from "@/components/driver/Journey";
import { Editorial } from "@/components/ui/Editorial";
import { Faq, type FaqItem } from "@/components/blocks/Faq";
import { Closing } from "@/components/layout/Closing";

export const metadata: Metadata = pageMetadata({
  title: "Become a Driver — Run With an Auto Transport Carrier",
  description:
    "Run your Truck / Power Unit with Solidify Transport, an auto transport motor carrier. Compensation based on a percentage of line-haul revenue, Net 30 terms, all 48 contiguous states with strong Western-US coverage. Review the opportunity and requirements, then continue to the driver application.",
  path: "/become-a-driver",
});

const holder = INSURANCE.certificateHolder.join(", ");

const WHY = [
  {
    index: 1,
    title: "You are paid on the line haul",
    meta: "Compensation",
    text: `${COMPENSATION.basis} Payment terms are ${COMPENSATION.terms}.`,
  },
  {
    index: 2,
    title: "Every load is vehicles",
    meta: "The work",
    text: "Solidify is an auto transport motor carrier. What you carry is cars, trucks and SUVs for manufacturers, dealerships and individuals.",
  },
  {
    index: 3,
    title: "All 48 contiguous states",
    meta: "Where you run",
    text: `${CLAIMS.coverageLong}, with a strong Western-US focus.`,
  },
  {
    index: 4,
    title: "You work with the carrier",
    meta: "Who you deal with",
    text: `Solidify operates the transport. Dispatch, paperwork and payment all run through the same company, based in ${COMPANY.city}, ${COMPANY.state}.`,
  },
];

const REQUIREMENTS = [
  {
    index: 1,
    title: "Truck / Power Unit and licensing",
    meta: "Equipment",
    text: "Your Truck / Power Unit with its VIN, year, make and model, plus your licensing details and the service areas you want to run.",
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
    text: "Completed once you are approved, through secure onboarding on this site — not on the application portal.",
  },
];

const FAQ: readonly FaqItem[] = [
  { q: "How am I paid?", a: `${COMPENSATION.basis} Payment terms are ${COMPENSATION.terms}.` },
  {
    q: "Where does the application happen?",
    a: "The application is completed through an external driver application portal. It opens in a new tab. Everything after approval — profile, equipment, insurance, W-9 and direct deposit — is completed on this site.",
  },
  {
    q: "What insurance do I need?",
    a: `Cargo at $500,000 minimum; commercial automobile liability at $1,000,000 combined single limit; general liability at $1,000,000 each occurrence and $1,000,000 general aggregate. The certificate is sent from your insurance agent and must show ${holder} as certificate holder and additional insured.`,
  },
  { q: "Where will I run?", a: "Solidify moves vehicles across all 48 contiguous states, with strong Western-US coverage." },
  {
    q: "What happens to the details I submit?",
    a: "Your onboarding is sent over an encrypted connection and delivered directly to Solidify Transport. This website does not keep a copy, and nothing is saved in your browser.",
  },
];

export default function BecomeADriverPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Become a Driver", path: "/become-a-driver" },
          ]),
          faqLd([...FAQ]),
        ]}
      />

      <PageHero
        mark={{ index: 1, label: "Become a driver" }}
        title={["Run your Truck /", "Power Unit with", "the carrier."]}
        lead={`${COMPENSATION.basis} Payment terms are ${COMPENSATION.terms}. Vehicle loads across all 48 contiguous states, with strong Western-US coverage.`}
        slot="driver-hero"
        grade="deep"
        primary={{ href: "#apply", label: "Continue to driver application" }}
        secondary={{ href: "#requirements", label: "Review the requirements" }}
        specs={[
          { label: "Compensation", value: COMPENSATION.basisShort },
          { label: "Terms", value: COMPENSATION.terms },
          { label: "Coverage", value: CLAIMS.coverage },
        ]}
      />

      <Editorial
        id="why"
        layout="ledger"
        surface="navy"
        head="stack"
        mark={{ index: 2, label: "Why run with Solidify" }}
        title={["What you get from", "running with the carrier."]}
        lead="Only what has been confirmed — no numbers we cannot stand behind."
        rows={WHY}
      />

      <Editorial
        id="requirements"
        layout="ledger"
        surface="graphite"
        head="editorial"
        mark={{ index: 3, label: "What you need" }}
        title={["Before you", "apply."]}
        lead="Have these ready. The insurance limits and the certificate holder below are exactly what the carrier requires."
        rows={REQUIREMENTS}
      />

      <Journey />

      <PortalHandoff />

      <Faq mark={{ index: 6, label: "Questions" }} title="Questions before you apply" items={FAQ} surface="navy" />

      <Closing
        title={["Run with", "the carrier."]}
        lead="Review the requirements, continue to the driver application, and complete onboarding here once you are approved."
        primary={{ href: "#apply", label: "Continue to driver application" }}
        secondary={{ href: "/contact", label: "Ask a question first" }}
      />
    </>
  );
}
