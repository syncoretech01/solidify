import type { Metadata } from "next";
import { pageMetadata, serviceLd } from "@/lib/seo";
import { META } from "@/lib/site";
import { HOME } from "@/lib/content/home";
import { JsonLd } from "@/components/layout/JsonLd";
import { Hero } from "@/components/home/Hero";
import { Lanes } from "@/components/home/Lanes";
import { Sequence } from "@/components/home/Sequence";
import { Editorial } from "@/components/ui/Editorial";
import { CoverageMap } from "@/components/blocks/CoverageMap";
import { Closing } from "@/components/layout/Closing";
import { Blueprint } from "@/components/graphics/Blueprint";

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
        graphic={
          <div className="plate plate-steel relative overflow-hidden p-6 lg:-ml-[3vw] lg:p-8">
            <div aria-hidden className="pointer-events-none absolute inset-0 guides" />
            <div className="mb-4 flex items-center justify-between">
              <span className="spec">Ramp · Load · Secure</span>
              <span className="spec !text-[var(--text-low)]">Fig. 04</span>
            </div>
            <Blueprint view="ramp" draw className="w-full" />
          </div>
        }
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
        mark={HOME.sheet.mark}
        title={HOME.sheet.title}
        lead={HOME.sheet.lead}
        specs={HOME.sheet.specs}
        graphic={
          <div className="flex h-full flex-col justify-center gap-4">
            <div className="flex items-center justify-between">
              <span className="spec">Auto hauler · elevation</span>
              <span className="spec !text-[var(--text-low)]">Fig. 07</span>
            </div>
            <Blueprint view="full" draw className="w-full" />
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
          <div className="relative h-full min-h-[260px]">
            <div className="absolute inset-y-0 -left-[4%] right-0 flex items-center">
              <Blueprint view="deck" draw className="w-full opacity-90" />
            </div>
          </div>
        }
        tight
      />

      <Closing title={HOME.closing.title} lead={HOME.closing.lead} slot="closing" />
    </>
  );
}
