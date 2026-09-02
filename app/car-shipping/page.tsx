import type { Metadata } from "next";
import { pageMetadata, serviceLd, breadcrumbLd, faqLd } from "@/lib/seo";
import { CTA } from "@/lib/site";
import { HOME } from "@/lib/content/home";
import { JsonLd } from "@/components/layout/JsonLd";
import { PageHero } from "@/components/blocks/PageHero";
import { SplitFeature } from "@/components/blocks/SplitFeature";
import { CardGrid } from "@/components/blocks/CardGrid";
import { ProcessSteps } from "@/components/blocks/ProcessSteps";
import { FormSection } from "@/components/blocks/FormSection";
import { Faq, type FaqItem } from "@/components/blocks/Faq";
import { SimpleCTA } from "@/components/blocks/SimpleCTA";

export const metadata: Metadata = pageMetadata({
  title: "Car Shipping — Nationwide Vehicle Transport by the Carrier",
  description:
    "Ship a car, truck or SUV anywhere in the 48 contiguous states with Solidify Transport, an auto transport motor carrier. Clear quotes, a documented pickup-to-delivery process, and one carrier from start to finish.",
  path: "/car-shipping",
});

const SITUATIONS = [
  { title: "Relocating", text: "Moving across the state or across the country and driving one vehicle while the other needs to arrive with you." },
  { title: "Buying out of state", text: "Found the right vehicle in another state. The carrier picks it up and delivers it to your door." },
  { title: "Seasonal moves", text: "A vehicle that spends part of the year somewhere else, moved each way by the same carrier." },
  { title: "Students and military", text: "A car that needs to be at a campus or a new duty station without adding miles to get there." },
  { title: "Family vehicles", text: "Sending a car to a family member, or bringing one home." },
  { title: "Dealer transfers", text: "Dealerships move vehicles the same way. See how we work with OEMs and dealerships.", kicker: "Commercial" },
] as const;

const QUOTE_ASIDE = [
  { title: "Route", text: "Pickup city and state, delivery city and state." },
  { title: "Vehicle", text: "Year, make and model — and whether it runs. Inoperable vehicles are quoted too." },
  { title: "Timing", text: "A preferred date or window. We come back with a pickup window we can hold." },
  { title: "Contact", text: "Name, phone and email so the carrier can confirm details with you directly." },
] as const;

const FAQ: readonly FaqItem[] = [
  {
    q: "Is Solidify a broker or the actual carrier?",
    a: "Solidify Transport is the motor carrier. We are not a broker. The company you get the quote from is the company that moves your vehicle.",
  },
  {
    q: "Where do you ship vehicles?",
    a: "Across all 48 contiguous states. Our strongest coverage runs through the Western states — California, Oregon, Washington, Nevada, Arizona, Utah, Idaho, Montana, Wyoming, Colorado and New Mexico.",
  },
  {
    q: "Can you move a vehicle that doesn't run?",
    a: "Yes. Tell us it is inoperable when you request a quote so the right equipment is planned for loading and unloading.",
  },
  {
    q: "What do I need to give you for a quote?",
    a: "Pickup and delivery locations, the vehicle's year, make and model, whether it runs, a preferred date, and your contact details.",
  },
  {
    q: "What happens at pickup and delivery?",
    a: "The vehicle is inspected and its condition documented at pickup before it is loaded and secured. At delivery it is unloaded and its condition is documented again at handover.",
  },
  {
    q: "How do I get a price?",
    a: "Use the quote form on this page or call us. Every quote is prepared by the carrier for your specific route and vehicle.",
  },
];

export default function CarShippingPage() {
  return (
    <>
      <JsonLd
        data={[
          serviceLd({
            name: "Car shipping",
            description: "Nationwide vehicle shipping for individuals and businesses, performed by Solidify Transport as the motor carrier.",
            path: "/car-shipping",
          }),
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Car Shipping", path: "/car-shipping" },
          ]),
          faqLd([...FAQ]),
        ]}
      />
      <PageHero
        eyebrow="Car shipping"
        title="Car shipping by the carrier, coast to coast."
        lead="Solidify Transport moves cars, trucks and SUVs across all 48 contiguous states as the motor carrier. One quote, one point of contact, and a documented process from pickup to delivery."
        slot="cs-hero"
        primary={{ href: "#quote", label: "Get a vehicle shipping quote" }}
        secondary={{ href: "#process", label: "How it works" }}
      />
      <SplitFeature
        id="what"
        eyebrow="What vehicle transport is"
        title="Your vehicle rides on a car carrier, not on its own wheels."
        text="Vehicle transport means your car is loaded onto a purpose-built car carrier at pickup, secured, driven to the destination on the carrier, and unloaded at delivery — with no miles added and no one else driving it."
        bullets={["Loaded, secured and unloaded by the carrier", "Condition documented at both ends", "Operable and inoperable vehicles"]}
        slot="cs-loading"
        surface="navy"
      />
      <CardGrid
        id="situations"
        eyebrow="Who uses it"
        title="Common reasons people ship a vehicle."
        items={SITUATIONS}
        columns={3}
        surface="steel"
      />
      <ProcessSteps id="process" eyebrow={HOME.process.eyebrow} title={HOME.process.title} lead="One vehicle, one process — every time." steps={HOME.process.steps} />
      <SplitFeature
        id="coverage"
        eyebrow="Coverage"
        title="All 48 contiguous states, strongest in the West."
        text="Wherever the route runs in the contiguous United States, the carrier handles it. If your pickup or delivery is in the West, you are in the region we cover most deeply."
        bullets={["Nationwide pickup and delivery", "Deep Western US coverage", "The same carrier at both ends"]}
        slot="cs-situations"
        flip
        surface="navy"
        aspect={16 / 10}
      />
      <FormSection
        id="quote"
        lane="vehicle"
        eyebrow="Get a quote"
        title="Tell the carrier about the move."
        lead="Four things and we can quote it: the route, the vehicle, the timing and how to reach you."
        slot="cs-quote-ground"
        aside={QUOTE_ASIDE}
      />
      <Faq title="Questions about car shipping" items={FAQ} surface="gunmetal" />
      <SimpleCTA title="One vehicle. One carrier." text="Request a quote and the carrier comes back to you directly." primary={{ href: "#quote", label: "Get a vehicle shipping quote" }} secondary={CTA.oem} />
    </>
  );
}
