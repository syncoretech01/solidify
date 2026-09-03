import type { Metadata } from "next";
import { pageMetadata, breadcrumbLd } from "@/lib/seo";
import { COMPANY, CLAIMS, CTA } from "@/lib/site";
import { JsonLd } from "@/components/layout/JsonLd";
import { Editorial } from "@/components/ui/Editorial";
import { CoverageMap } from "@/components/blocks/CoverageMap";
import { Closing } from "@/components/layout/Closing";
import { Blueprint } from "@/components/graphics/Blueprint";
import { Button } from "@/components/ui/Button";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { SectionMark, PhoneLink, Lines } from "@/components/ui/Primitives";
import { LightSweep } from "@/components/ui/LightSweep";

export const metadata: Metadata = pageMetadata({
  title: "About Solidify Transport — Auto Transport Motor Carrier, Tracy, CA",
  description:
    "Solidify Transport LLC is an auto transport motor carrier based in Tracy, California, moving vehicles for OEMs, dealerships and consumers across all 48 contiguous states with strong Western-US coverage.",
  path: "/about",
});

const WHO = [
  { title: "OEMs and manufacturers", text: "Vehicle movement between plants, distribution points and dealer networks.", meta: "B2B" },
  { title: "Dealerships and dealer groups", text: "Dealer transfers, inventory relocation and retail delivery.", meta: "B2B" },
  { title: "Consumers", text: "Relocations, out-of-state purchases, seasonal and family moves.", meta: "B2C" },
  { title: "Owner-operators", text: "Qualified operators who run their Truck / Power Unit with Solidify and meet the carrier's insurance and equipment requirements.", meta: "Partners" },
] as const;

const HOW = [
  { title: "Quote", text: "Tell the carrier the route, the vehicle and the timing. The quote comes from the company that moves it." },
  { title: "Schedule", text: "The carrier confirms a pickup window and the contact at each end." },
  { title: "Carry", text: "The vehicle is loaded and secured on the carrier, travels on the carrier, and is unloaded and handed over at the delivery address." },
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

      {/* Hero: the hauler, drawn */}
      <section id="hero" data-section="hero" data-surface="deep" data-head="hero" aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-[var(--surface)] text-[var(--text-hi)]">
        <div aria-hidden className="pointer-events-none absolute inset-0 guides opacity-50" />
        <div aria-hidden className="light-field opacity-70" />
        <div className="shell relative z-10 flex min-h-[84svh] flex-col justify-end gap-10 pb-[clamp(2.5rem,6vh,4.5rem)] pt-[calc(var(--nav-h)+4rem)]">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="flex flex-col gap-6 lg:col-span-6">
              <Reveal immediate delay={0.1} y={10}>
                <SectionMark index={1} label="About Solidify" />
              </Reveal>
              <RevealText as="h1" id="hero-title" immediate delay={0.25} className="display-lg max-w-[13ch]">
                <Lines text={["An auto transport", "motor carrier.", "Vehicles are the", "whole business."]} />
              </RevealText>
              <Reveal immediate delay={0.7}>
                <p className="lead max-w-[46ch]">
                  {COMPANY.legalName} is the carrier, not a broker. Based in {COMPANY.city}, California, we move cars, trucks and SUVs for OEMs, dealerships and consumers across all 48 contiguous states, with strong Western-US coverage.
                </p>
              </Reveal>
              <Reveal immediate delay={0.85} className="flex flex-wrap gap-3">
                <Button href={CTA.quote.href}>{CTA.quote.label}</Button>
                <Button href={CTA.oem.href} variant="steel">
                  {CTA.oem.label}
                </Button>
              </Reveal>
            </div>
            <div className="plate plate-steel relative overflow-hidden p-5 lg:col-span-6 lg:p-7">
              <LightSweep trigger="inview" delay={1.2} />
              <div aria-hidden className="pointer-events-none absolute inset-0 guides" />
              <div className="relative flex items-center justify-between">
                <span className="spec">Auto hauler · elevation</span>
                <span className="spec !text-[var(--text-low)]">Fig. 01</span>
              </div>
              <Blueprint view="full" draw immediate className="relative mt-4 w-full" title="Technical elevation of a loaded auto hauler" />
            </div>
          </div>
          <div className="hairline-route" aria-hidden />
        </div>
      </section>

      <Editorial
        id="identity"
        layout="plate"
        surface="graphite"
        mark={{ index: 2, label: "The company" }}
        title={[COMPANY.legalName]}
        lead="Where the carrier is based, what it moves and where it runs."
        specs={[
          { label: "Business", value: COMPANY.descriptor },
          { label: "Location", value: `${COMPANY.street}, ${COMPANY.city}, ${COMPANY.state} ${COMPANY.zip}` },
          { label: "Phone", value: COMPANY.phone, href: COMPANY.phoneHref },
          { label: "Coverage", value: CLAIMS.coverage },
          { label: "Focus", value: CLAIMS.focus },
        ]}
        graphic={
          <div className="flex h-full flex-col justify-center gap-4">
            <div className="flex items-center justify-between">
              <span className="spec">Power unit</span>
              <span className="spec !text-[var(--text-low)]">Fig. 02</span>
            </div>
            <Blueprint view="cab" draw className="w-full" />
          </div>
        }
      />

      <Editorial id="who" layout="ledger" surface="navy" head="index" mark={{ index: 3, label: "Who we work with" }} title={["Four kinds of people", "rely on the carrier."]} rows={WHO} />

      <CoverageMap id="coverage" mark={{ index: 4, label: "Coverage" }} title="All 48 contiguous states. Strong Western-US focus." lead="Solidify moves vehicles across the contiguous United States, with strong Western-US coverage — California, Oregon, Washington, Nevada, Arizona, Utah, Idaho, Montana, Wyoming, Colorado and New Mexico." surface="graphite" />

      <Editorial
        id="how"
        layout="ledger"
        surface="deep"
        mark={{ index: 5, label: "How we operate" }}
        title={["Quote.", "Schedule. Carry."]}
        lead="The same three steps for one vehicle or a dealer's inventory."
        rows={HOW}
        actions={[{ href: CTA.quote.href, label: CTA.quote.label, variant: "steel" }]}
      >
        <div className="mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="label">Reach the carrier</span>
          <PhoneLink className="font-display text-[var(--step-2)] font-semibold text-[var(--text-hi)]" />
        </div>
      </Editorial>

      <Closing title={["Work with", "the carrier."]} lead="Get a quote for one vehicle, or start a commercial inquiry for many." />
    </>
  );
}
