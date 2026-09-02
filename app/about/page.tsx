import type { Metadata } from "next";
import { pageMetadata, breadcrumbLd } from "@/lib/seo";
import { COMPANY, ADDRESS_LINES, CTA } from "@/lib/site";
import { JsonLd } from "@/components/layout/JsonLd";
import { PageHero } from "@/components/blocks/PageHero";
import { PointsBand } from "@/components/blocks/PointsBand";
import { CardGrid } from "@/components/blocks/CardGrid";
import { SplitFeature } from "@/components/blocks/SplitFeature";
import { TrustGrid } from "@/components/blocks/TrustGrid";
import { SimpleCTA } from "@/components/blocks/SimpleCTA";

export const metadata: Metadata = pageMetadata({
  title: "About Solidify Transport — Auto Transport Motor Carrier, Tracy, CA",
  description:
    "Solidify Transport LLC is an auto transport motor carrier based in Tracy, California, moving vehicles for OEMs, dealerships and consumers across all 48 contiguous states with strong Western US coverage.",
  path: "/about",
});

const WHAT_POINTS = [
  { title: "Vehicles, only", text: "Cars, trucks and SUVs. Auto transport is the whole business, not one service among many." },
  { title: "The carrier, not a broker", text: "Solidify performs the transport. No middleman, no hand-off." },
  { title: "Nationwide, Western depth", text: "All 48 contiguous states, with the strongest coverage across the Western states." },
] as const;

const WHO = [
  { title: "OEMs and manufacturers", text: "Vehicle movement between plants, distribution points and dealer networks.", kicker: "B2B" },
  { title: "Dealerships and dealer groups", text: "Dealer transfers, inventory relocation and retail delivery.", kicker: "B2B" },
  { title: "Consumers", text: "Relocations, out-of-state purchases, seasonal and family moves.", kicker: "B2C" },
  { title: "Owner-operators", text: "Qualified operators who run their truck / power unit with Solidify.", kicker: "Partners" },
] as const;

const HOW = [
  { title: "Carrier-direct", text: "The company that quotes the move is the company that performs it. One point of contact from start to finish." },
  { title: "A documented process", text: "Condition documented at pickup and again at delivery. Every move follows the same steps." },
  { title: "Straight communication", text: "Real people, a real phone number, and answers from the carrier rather than a middle layer." },
  { title: "Qualified operators", text: "Our capacity runs on owner-operators who meet the carrier's insurance and equipment requirements before they move a vehicle." },
] as const;

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />
      <PageHero
        eyebrow="About Solidify"
        title="An auto transport motor carrier, built for the vehicle."
        lead={`${COMPANY.legalName} is a motor carrier that transports vehicles. Based in ${COMPANY.city}, California, we move cars, trucks and SUVs for OEMs, dealerships and consumers across all 48 contiguous states, with our strongest coverage in the West.`}
        slot="about-hero"
        primary={CTA.quote}
        secondary={CTA.oem}
      />
      <PointsBand
        id="what"
        eyebrow="What we are"
        title="Not a broker. Not a freight fleet. A vehicle carrier."
        lead="Every part of Solidify — equipment, process, people — is organised around moving vehicles safely from one place to another. That focus is the point."
        points={WHAT_POINTS}
        slot="about-detail"
        surface="deep"
      />
      <CardGrid id="who" eyebrow="Who we work with" title="Four kinds of people rely on the carrier." items={WHO} columns={4} surface="navy" numbered={false} />
      <SplitFeature
        id="coverage"
        eyebrow="Coverage"
        title="Nationwide reach. Western strength."
        text="Solidify moves vehicles across the contiguous United States. Our deepest coverage runs through the Western states — California, Oregon, Washington, Nevada, Arizona, Utah, Idaho, Montana, Wyoming, Colorado and New Mexico."
        bullets={["All 48 contiguous states", "Strongest across the West", "Based in Tracy, California"]}
        slot="about-coverage"
        surface="steel"
        flip
        aspect={16 / 10}
      />
      <TrustGrid id="how" eyebrow="How we operate" title="Straightforward, documented, carrier-direct." items={HOW} slot="home-trust" surface="ice" />
      <section data-section="identity" data-surface="gunmetal" className="section section-tight bg-[var(--surface)] text-[var(--text-hi)]" aria-labelledby="identity-title">
        <div className="shell grid gap-8 lg:grid-cols-12">
          <div className="flex flex-col gap-3 lg:col-span-5">
            <span className="eyebrow">Company</span>
            <h2 id="identity-title" className="display-sm">
              {COMPANY.legalName}
            </h2>
          </div>
          <dl className="grid gap-6 sm:grid-cols-2 lg:col-span-7">
            <div className="flex flex-col gap-1">
              <dt className="label">Address</dt>
              <dd className="body">
                {ADDRESS_LINES[0]}
                <br />
                {ADDRESS_LINES[1]}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="label">Phone</dt>
              <dd className="body">
                <a href={COMPANY.phoneHref} className="link-underline text-[var(--text-hi)]" data-phone-link>
                  {COMPANY.phone}
                </a>
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="label">Business</dt>
              <dd className="body">{COMPANY.descriptor}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="label">Coverage</dt>
              <dd className="body">All 48 contiguous states · Western US strength</dd>
            </div>
          </dl>
        </div>
      </section>
      <SimpleCTA title="Work with the carrier." text="Get a quote for one vehicle, or start a commercial inquiry for many." />
    </>
  );
}
