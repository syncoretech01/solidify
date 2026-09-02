import type { Metadata } from "next";
import { pageMetadata, serviceLd } from "@/lib/seo";
import { META } from "@/lib/site";
import { HOME } from "@/lib/content/home";
import { JsonLd } from "@/components/layout/JsonLd";
import { Hero } from "@/components/home/Hero";
import { AudiencePaths } from "@/components/blocks/AudiencePaths";
import { PointsBand } from "@/components/blocks/PointsBand";
import { SplitFeature } from "@/components/blocks/SplitFeature";
import { ProcessSteps } from "@/components/blocks/ProcessSteps";
import { CoverageMap } from "@/components/blocks/CoverageMap";
import { TrustGrid } from "@/components/blocks/TrustGrid";
import { OperatorBand } from "@/components/blocks/OperatorBand";
import { CTABand } from "@/components/blocks/CTABand";

export const metadata: Metadata = pageMetadata({
  title: META.defaultTitle,
  description: META.description,
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={serviceLd({
          name: "Auto transport",
          description: "Vehicle transport for OEMs, dealerships and consumers across all 48 contiguous states, performed by Solidify Transport as the motor carrier.",
          path: "/",
        })}
      />
      <Hero />
      <AudiencePaths eyebrow={HOME.paths.eyebrow} title={HOME.paths.title} items={HOME.paths.items} />
      <PointsBand id="what" eyebrow={HOME.what.eyebrow} title={HOME.what.title} lead={HOME.what.lead} points={HOME.what.points} slot={HOME.what.slot} />
      <SplitFeature
        id="car-shipping"
        eyebrow={HOME.carShipping.eyebrow}
        title={HOME.carShipping.title}
        text={HOME.carShipping.text}
        bullets={HOME.carShipping.bullets}
        href={HOME.carShipping.href}
        cta={HOME.carShipping.cta}
        slot={HOME.carShipping.slot}
        surface="navy"
      />
      <SplitFeature
        id="oem"
        eyebrow={HOME.oem.eyebrow}
        title={HOME.oem.title}
        text={HOME.oem.text}
        bullets={HOME.oem.bullets}
        href={HOME.oem.href}
        cta={HOME.oem.cta}
        slot={HOME.oem.slot}
        surface="steel"
        flip
        aspect={16 / 11}
      />
      <ProcessSteps eyebrow={HOME.process.eyebrow} title={HOME.process.title} lead={HOME.process.lead} steps={HOME.process.steps} />
      <CoverageMap eyebrow={HOME.coverage.eyebrow} title={HOME.coverage.title} lead={HOME.coverage.lead} />
      <TrustGrid eyebrow={HOME.trust.eyebrow} title={HOME.trust.title} items={HOME.trust.items} slot={HOME.trust.slot} />
      <OperatorBand eyebrow={HOME.operator.eyebrow} title={HOME.operator.title} text={HOME.operator.text} href={HOME.operator.href} cta={HOME.operator.cta} />
      <CTABand title={HOME.cta.title} text={HOME.cta.text} slot={HOME.cta.slot} />
    </>
  );
}
