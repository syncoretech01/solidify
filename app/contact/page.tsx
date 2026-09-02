import type { Metadata } from "next";
import { Suspense } from "react";
import { pageMetadata, breadcrumbLd } from "@/lib/seo";
import { COMPANY, ADDRESS_LINES } from "@/lib/site";
import { JsonLd } from "@/components/layout/JsonLd";
import { PageHero } from "@/components/blocks/PageHero";
import { ContactLanes } from "@/components/forms/ContactLanes";
import { Reveal } from "@/components/ui/Reveal";
import { Section, PhoneLink } from "@/components/ui/Primitives";

export const metadata: Metadata = pageMetadata({
  title: "Get a Quote — Contact Solidify Transport",
  description:
    "Get a vehicle shipping quote, start an OEM or dealership inquiry, or reach Solidify Transport about owner-operator opportunities. Auto transport motor carrier, Tracy, California. (510) 499-4552.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <PageHero
        eyebrow="Get a quote"
        title="Get a quote, or reach the carrier."
        lead="Three kinds of inquiry, each to the right place. Vehicle shipping quotes, OEM and dealership movement, and owner-operator questions all go straight to Solidify Transport — the carrier."
        slot="contact-hero"
        compact
      />

      <Section surface="navy" id="inquiry" ariaLabelledBy="inquiry-title">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="flex flex-col gap-8 lg:col-span-4">
            <div className="flex flex-col gap-4">
              <span className="eyebrow">Contact</span>
              <h2 id="inquiry-title" className="display-sm">
                Choose your inquiry.
              </h2>
              <p className="body">Pick the lane that matches you. Every form reaches the carrier directly.</p>
            </div>
            <Reveal as="address" className="flex flex-col gap-5 not-italic">
              <div className="flex flex-col gap-1">
                <span className="label">Phone</span>
                <PhoneLink className="font-display text-[var(--step-2)] font-semibold text-[var(--text-hi)]" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="label">Office</span>
                <span className="body">
                  {COMPANY.legalName}
                  <br />
                  {ADDRESS_LINES[0]}
                  <br />
                  {ADDRESS_LINES[1]}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="label">Business</span>
                <span className="body">{COMPANY.descriptor} · All 48 contiguous states · Western US strength</span>
              </div>
            </Reveal>
          </div>
          <div className="lg:col-span-8">
            <Suspense fallback={<div className="panel steel-edge min-h-[420px]" aria-hidden />}>
              <ContactLanes />
            </Suspense>
          </div>
        </div>
      </Section>
    </>
  );
}
