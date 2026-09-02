import type { Metadata } from "next";
import { pageMetadata, serviceLd, breadcrumbLd } from "@/lib/seo";
import { CTA } from "@/lib/site";
import { JsonLd } from "@/components/layout/JsonLd";
import { PageHero } from "@/components/blocks/PageHero";
import { PointsBand } from "@/components/blocks/PointsBand";
import { CardGrid } from "@/components/blocks/CardGrid";
import { SplitFeature } from "@/components/blocks/SplitFeature";
import { CoverageMap } from "@/components/blocks/CoverageMap";
import { FormSection } from "@/components/blocks/FormSection";
import { CTABand } from "@/components/blocks/CTABand";

export const metadata: Metadata = pageMetadata({
  title: "OEM & Dealership Vehicle Transport — Carrier-Operated",
  description:
    "Vehicle transport for OEMs, dealerships and dealer groups from Solidify Transport, an auto transport motor carrier. Inventory relocation, dealer transfers and retail delivery across all 48 contiguous states, with strong Western US coverage.",
  path: "/oem-dealerships",
});

const ROLE_POINTS = [
  { title: "Carrier-operated moves", text: "Solidify performs the transport. There is no hand-off to a third-party carrier and no capacity being sourced elsewhere." },
  { title: "Direct accountability", text: "One company is responsible for the vehicle from loading to handover — the one you are talking to." },
  { title: "Built for repeat movement", text: "A vehicle-only carrier with a consistent process, so the tenth move runs like the first." },
] as const;

const AUDIENCES = [
  { title: "OEMs and manufacturers", text: "Vehicle movement between plants, distribution points, storage and dealer networks, handled by a carrier whose only cargo is vehicles.", kicker: "Manufacturers" },
  { title: "Dealerships", text: "Dealer-to-dealer transfers, inventory rebalancing and delivery to the retail customer, with one carrier contact for your store.", kicker: "Retail" },
  { title: "Dealer groups", text: "Movement across a group's rooftops and regions, run by the same carrier with the same process at every location.", kicker: "Multi-store" },
] as const;

const MOVEMENT = [
  { title: "Dealer-to-dealer transfers", text: "A vehicle sold at one store and sitting at another. The carrier picks it up and delivers it to the selling dealership." },
  { title: "Inventory relocation", text: "Moving units between lots, storage and stores as demand shifts across regions." },
  { title: "Retail delivery", text: "Delivering a sold vehicle to the customer's address — the last step of the sale, carried by the carrier." },
  { title: "Fleet and commercial vehicles", text: "Company vehicles and light commercial units moved between locations." },
] as const;

const ENGAGEMENT = [
  { title: "Scope the movement", text: "Origins, destinations, vehicle types and cadence — one move or a recurring lane." },
  { title: "Schedule", text: "The carrier confirms pickup windows and the contact at each end." },
  { title: "Move and document", text: "Condition documented at pickup and delivery, with the carrier as your single point of contact throughout." },
] as const;

const INQUIRY_ASIDE = [
  { title: "Organization", text: "OEM, dealership or dealer group, and your role." },
  { title: "Movement", text: "Origin and destination regions, vehicle types and approximate volume." },
  { title: "Follow-up", text: "The carrier's team reviews the inquiry and follows up directly." },
] as const;

export default function OemDealershipsPage() {
  return (
    <>
      <JsonLd
        data={[
          serviceLd({
            name: "OEM and dealership vehicle transport",
            description: "Inventory relocation, dealer transfers and retail vehicle delivery for OEMs, dealerships and dealer groups, performed by Solidify Transport as the motor carrier.",
            path: "/oem-dealerships",
          }),
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "OEM & Dealerships", path: "/oem-dealerships" },
          ]),
        ]}
      />
      <PageHero
        eyebrow="OEM & dealership transport"
        title="Vehicle transport for OEMs, dealerships and dealer groups."
        lead="A motor carrier built around vehicles. Inventory relocation, dealer transfers and retail delivery across all 48 contiguous states — with one carrier contact for your team and strong Western US coverage."
        slot="oem-hero"
        primary={{ href: "#inquiry", label: "Start a commercial inquiry" }}
        secondary={{ href: "#movement", label: "What we move" }}
      />
      <PointsBand
        id="role"
        eyebrow="Our role"
        title="You are working with the carrier."
        lead="Solidify Transport is the motor carrier. We do not broker vehicle moves, match loads or source trucks from a network. When your team calls, they are talking to the company that operates the transport."
        points={ROLE_POINTS}
        slot="oem-environment"
        surface="deep"
      />
      <CardGrid id="audiences" eyebrow="Who we serve" title="Manufacturers, dealerships and dealer groups." items={AUDIENCES} columns={3} surface="navy" numbered={false} />
      <SplitFeature
        id="movement"
        eyebrow="What we move"
        title="The movements a dealership actually needs."
        text="Commercial vehicle transport is a set of repeatable movements. Solidify runs them as the carrier, with the same process on every one."
        bullets={MOVEMENT.map((m) => `${m.title} — ${m.text}`)}
        slot="oem-movement"
        surface="steel"
        aspect={4 / 5}
      />
      <CardGrid id="engagement" eyebrow="How engagement works" title="Scope. Schedule. Move." lead="Three steps, whether it is a single transfer or a recurring lane." items={ENGAGEMENT} columns={3} surface="gunmetal" />
      <CoverageMap
        eyebrow="Coverage"
        title="Every contiguous state, with the deepest coverage in the West."
        lead="Solidify moves vehicles across the contiguous United States. For OEM and dealer movement in the Western states, you are working in the region we cover most deeply."
        surface="navy"
      />
      <FormSection
        id="inquiry"
        lane="oem"
        eyebrow="Commercial inquiry"
        title="Outline the movement. The carrier follows up."
        lead="Tell us who you are, what needs to move and roughly how much. A member of the carrier's team follows up directly."
        aside={INQUIRY_ASIDE}
      />
      <CTABand id="cta" title="Talk to the carrier about your vehicle movement." text="OEM, dealership or dealer group — start with a commercial inquiry." slot="oem-cta" primary={{ href: "#inquiry", label: "Start a commercial inquiry" }} secondary={CTA.quote} />
    </>
  );
}
