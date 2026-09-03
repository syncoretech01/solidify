import { CLAIMS, CTA, COMPENSATION } from "@/lib/site";

export const HOME = {
  hero: {
    eyebrow: "Auto transport motor carrier",
    title: "Nationwide auto transport, carrier-direct.",
    lead: `Solidify Transport is an auto transport motor carrier. We move vehicles for OEMs, dealerships and consumers across all 48 contiguous states, with strong Western US coverage — and you deal with the carrier, not a broker.`,
    primary: CTA.quote,
    secondary: CTA.oem,
    tertiary: CTA.drive,
    claims: [
      { value: "48", label: "Contiguous states" },
      { value: "West", label: "Strongest coverage" },
      { value: "1", label: "Carrier, start to finish" },
    ],
  },

  paths: {
    eyebrow: "Who we move vehicles for",
    title: "Three ways to work with the carrier.",
    items: [
      {
        slot: "home-car-shipping",
        title: "Ship a vehicle",
        kicker: "Consumers & individuals",
        text: "Relocating, bought a car out of state, or need a vehicle moved across the country. Get a quote from the carrier that moves it.",
        href: "/car-shipping",
        cta: "Car shipping",
      },
      {
        slot: "home-oem",
        title: "OEM & dealership transport",
        kicker: "Manufacturers & dealers",
        text: "Inventory movement, dealer transfers and retail deliveries handled by a motor carrier built around vehicles.",
        href: "/oem-dealerships",
        cta: "Commercial solutions",
      },
      {
        slot: "home-operator",
        title: "Drive with Solidify",
        kicker: "Owner-operators",
        text: `Run your truck / power unit with an auto transport carrier. ${COMPENSATION.basisShort}, ${COMPENSATION.terms} terms.`,
        href: "/owner-operators",
        cta: "Owner operators",
      },
    ],
  },

  what: {
    eyebrow: "What Solidify does",
    title: "A motor carrier built around vehicles.",
    lead: "Solidify Transport transports vehicles. That is the whole business — not a broker, not a middleman, not a freight fleet with a car trailer on the side.",
    points: [
      {
        title: "Vehicle-only focus",
        text: "Cars, trucks and SUVs for manufacturers, dealerships and individuals. Auto transport is what we do, not one line on a services list.",
      },
      {
        title: "Carrier, not broker",
        text: "When you work with Solidify, the company you are talking to is the carrier moving your vehicle — one point of contact from quote to delivery.",
      },
      {
        title: "Nationwide, with Western depth",
        text: `${CLAIMS.coverageLong}, with the strongest coverage across the Western states.`,
      },
    ],
    slot: "home-what",
  },

  carShipping: {
    eyebrow: "Car shipping",
    title: "Vehicle shipping for people, not pallets.",
    text: "Moving across the country, buying a car in another state, sending a vehicle to a family member or a second home — Solidify moves it as the carrier, with a clear quote and a clear process.",
    bullets: ["Nationwide pickup and delivery", "Operable and inoperable vehicles quoted", "One carrier from pickup to delivery"],
    href: "/car-shipping",
    cta: "Explore car shipping",
    slot: "cs-situations",
  },

  oem: {
    eyebrow: "OEM & dealerships",
    title: "Commercial vehicle movement, operated by the carrier.",
    text: "For OEMs, dealerships and dealer groups: inventory relocation, dealer-to-dealer transfers and retail deliveries, run by a motor carrier whose only cargo is vehicles.",
    bullets: ["Dealer transfers and inventory moves", "Retail delivery to the customer", "A single carrier contact for your team"],
    href: "/oem-dealerships",
    cta: "OEM & dealership solutions",
    slot: "oem-hero",
  },

  process: {
    eyebrow: "How vehicle transport works",
    title: "Pickup. Transit. Delivery.",
    lead: "The same process whether it is one vehicle or a dealer's inventory.",
    steps: [
      {
        title: "Quote and schedule",
        text: "Tell us the pickup and delivery locations, the vehicle, and whether it runs. You get a quote from the carrier and a pickup window.",
        slot: "process-pickup",
      },
      {
        title: "Pickup and inspection",
        text: "The vehicle is inspected and its condition documented, then loaded and secured on the carrier.",
        slot: "process-transit",
      },
      {
        title: "Transit and delivery",
        text: "The vehicle travels on the carrier to the delivery address, is unloaded, and its condition is documented again at handover.",
        slot: "process-delivery",
      },
    ],
  },

  coverage: {
    eyebrow: "Coverage",
    title: "All 48 contiguous states. Strongest in the West.",
    lead: "Solidify moves vehicles across the contiguous United States. Our deepest coverage runs through the Western states — California, Oregon, Washington, Nevada, Arizona, Utah, Idaho, Montana, Wyoming, Colorado and New Mexico.",
    slot: "home-coverage",
  },

  trust: {
    eyebrow: "Why Solidify",
    title: "Trust built on how we work, not on numbers we made up.",
    items: [
      {
        title: "A vehicle-only carrier",
        text: "Equipment, process and people are organised around moving vehicles safely — nothing else competes for the deck.",
      },
      {
        title: "You talk to the carrier",
        text: "No hand-off to a third party. The company quoting the move is the company moving the vehicle.",
      },
      {
        title: "A clear, documented process",
        text: "Condition documented at pickup and again at delivery. Every move follows the same steps.",
      },
      {
        title: "A real company with a real address",
        text: "Solidify Transport LLC, Tracy, California. A phone number a person answers.",
      },
    ],
    slot: "home-trust",
  },

  operator: {
    eyebrow: "Owner-operators",
    title: "Run your truck / power unit with an auto transport carrier.",
    text: `${COMPENSATION.basis} Payment terms are ${COMPENSATION.terms}. Apply through our driver portal, and once approved, complete onboarding securely online.`,
    href: "/owner-operators",
    cta: CTA.drive.label,
  },

  cta: {
    title: "Ready to move a vehicle?",
    text: "Get a quote from the carrier — for one car or a dealer's inventory.",
    slot: "home-cta",
  },
} as const;
