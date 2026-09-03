import type { Metadata } from "next";
import { pageMetadata, serviceLd, breadcrumbLd } from "@/lib/seo";
import { CTA, CLAIMS, COMPANY } from "@/lib/site";
import { JsonLd } from "@/components/layout/JsonLd";
import { PageHero } from "@/components/blocks/PageHero";
import { Editorial } from "@/components/ui/Editorial";
import { MovementBoard } from "@/components/oem/MovementBoard";
import { CoverageMap } from "@/components/blocks/CoverageMap";
import { FormConsole } from "@/components/forms/FormConsole";
import { Closing } from "@/components/layout/Closing";

export const metadata: Metadata = pageMetadata({
  title: "OEM & Dealership Vehicle Transport — Carrier-Operated",
  description:
    "Vehicle transport for OEMs, dealerships and dealer groups from Solidify Transport, an auto transport motor carrier. Inventory relocation, dealer transfers and retail delivery across all 48 contiguous states, with strong Western-US coverage.",
  path: "/oem-dealerships",
});

const ENGAGEMENT = [
  { title: "Scope the movement", text: "Origins, destinations, vehicle types and cadence — one move or a recurring schedule.", meta: "Scope" },
  { title: "Schedule", text: "The carrier confirms pickup windows and the contact at each end.", meta: "Schedule" },
  { title: "Move", text: "The carrier loads, carries and delivers, with a single contact for your team throughout.", meta: "Move" },
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
        mark={{ index: 1, label: "OEM & dealership transport" }}
        title={["Vehicle transport", "for OEMs, dealerships", "and dealer groups."]}
        lead="A motor carrier built around vehicles. Inventory relocation, dealer transfers and retail delivery across all 48 contiguous states, with one carrier contact for your team."
        slot="oem-hero"
        grade="cool"
        primary={{ href: "#inquiry", label: "Start a commercial inquiry" }}
        secondary={{ href: "#movement", label: "See the movement board" }}
      />

      <Editorial
        id="role"
        layout="statement"
        mark={{ index: 2, label: "Our role" }}
        title={["You are working", "with the carrier."]}
        lead="Solidify Transport is the motor carrier. Your team works with the company that operates the transport — for manufacturers, dealerships and dealer groups."
        media={{ slot: "oem-role", grade: "deep" }}
        specs={[
          { label: "Business", value: COMPANY.descriptor },
          { label: "Serves", value: "OEMs · Dealerships · Dealer groups" },
          { label: "Coverage", value: `${CLAIMS.coverage} · ${CLAIMS.focus}` },
        ]}
      />

      <MovementBoard id="movement" mark={{ index: 3, label: "What we move" }} action={{ href: "#inquiry", label: "Start a commercial inquiry" }} />

      <Editorial
        id="engagement"
        layout="ledger"
        surface="navy"
        head="index"
        mark={{ index: 4, label: "How engagement works" }}
        title={["Scope.", "Schedule. Move."]}
        lead="Three steps, whether it is a single transfer or a recurring schedule."
        rows={ENGAGEMENT}
      />

      <CoverageMap
        id="coverage"
        mark={{ index: 5, label: "Coverage" }}
        title="Every contiguous state, with strong Western-US coverage."
        lead="Solidify moves vehicles across the contiguous United States. For OEM and dealer movement in the Western states, that means strong Western-US coverage on both ends."
        surface="graphite"
      />

      <FormConsole
        id="inquiry"
        lane="oem"
        surface="deep"
        mark={{ index: 6, label: "Commercial inquiry" }}
        title={["Outline the movement.", "The carrier follows up."]}
        lead="Tell us who you are, what needs to move and roughly how much. A member of the carrier's team follows up directly."
        specs={[
          { label: "Organization", value: "OEM, dealership or dealer group" },
          { label: "Movement", value: "Origin and destination regions, vehicle types, volume" },
          { label: "Follow-up", value: "The carrier's team reviews it and replies directly" },
        ]}
      />

      <Closing title={["Talk to the carrier", "about your movement."]} lead="OEM, dealership or dealer group — start with a commercial inquiry." primary={{ href: "#inquiry", label: "Start a commercial inquiry" }} secondary={CTA.quote} />
    </>
  );
}
