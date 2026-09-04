import type { Metadata } from "next";
import { pageMetadata, serviceLd } from "@/lib/seo";
import { META } from "@/lib/site";
import { HOME } from "@/lib/content/home";
import { JsonLd } from "@/components/layout/JsonLd";
import { Hero } from "@/components/home/Hero";
import { Lanes } from "@/components/home/Lanes";
import { Sequence } from "@/components/home/Sequence";
import { Editorial } from "@/components/ui/Editorial";
import { Plate } from "@/components/ui/Plate";
import { CoverageMap } from "@/components/blocks/CoverageMap";
import { Closing } from "@/components/layout/Closing";

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
      <Lanes />

      <Editorial
        id="statement"
        layout="statement"
        mark={HOME.statement.mark}
        title={HOME.statement.title}
        lead={HOME.statement.lead}
        media={{ slot: HOME.statement.slot, grade: "deep" }}
        specs={HOME.statement.specs}
      />

      <Sequence id="sequence" />

      <Editorial
        id="car-shipping"
        layout="feature"
        surface="navy"
        head="editorial"
        mark={HOME.carShipping.mark}
        title={HOME.carShipping.title}
        lead={HOME.carShipping.lead}
        media={{ slot: "seq-pickup", aspect: 4 / 3, grade: "deep", caption: "Secured on the deck at pickup" }}
        specs={HOME.carShipping.specs}
        actions={[{ href: HOME.carShipping.href, label: HOME.carShipping.cta }]}
      />

      <Editorial
        id="oem"
        layout="feature"
        surface="steel"
        flip
        head="index"
        mark={HOME.oem.mark}
        title={HOME.oem.title}
        lead={HOME.oem.lead}
        media={{ slot: HOME.oem.slot, aspect: 16 / 11, grade: "cool", caption: "New-vehicle inventory, staged" }}
        bullets={HOME.oem.bullets}
        actions={[{ href: HOME.oem.href, label: HOME.oem.cta, variant: "steel" }]}
      />

      <CoverageMap mark={HOME.coverage.mark} title={HOME.coverage.title} lead={HOME.coverage.lead} surface="navy" />

      <Editorial
        id="sheet"
        layout="plate"
        surface="graphite"
        tight
        mark={HOME.sheet.mark}
        title={HOME.sheet.title}
        lead={HOME.sheet.lead}
        specs={HOME.sheet.specs}
        graphic={
          <div className="relative h-full min-h-[260px] overflow-hidden rounded-[var(--radius-sm)]">
            <Plate slot="home-sheet" sizes="(max-width: 1024px) 90vw, 44vw" aspect="fill" parallax={6} reveal={false} overscan={1.08} grade="deep" dim={0.86} className="!absolute inset-0 h-full w-full" />
            <div aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,15,24,0.75),transparent_60%)]" />
          </div>
        }
      />

      <Editorial
        id="operators"
        layout="plate"
        surface="navy"
        flip
        head="index"
        mark={HOME.operator.mark}
        title={HOME.operator.title}
        lead={HOME.operator.lead}
        specs={HOME.operator.specs}
        actions={[{ href: HOME.operator.href, label: HOME.operator.cta, variant: "steel" }]}
        graphic={
          <div className="relative h-full min-h-[280px] overflow-hidden rounded-[var(--radius-sm)]">
            <Plate slot="lane-operator" sizes="(max-width: 1024px) 90vw, 46vw" aspect="fill" parallax={8} reveal={false} overscan={1.1} grade="cool" dim={0.82} className="!absolute inset-0 h-full w-full" />
            <div aria-hidden className="absolute inset-0 bg-[linear-gradient(270deg,rgba(8,11,18,0.7),transparent_62%)]" />
          </div>
        }
        tight
      />

      <Closing title={HOME.closing.title} lead={HOME.closing.lead} slot="closing" />
    </>
  );
}
