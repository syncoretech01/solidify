/**
 * SOLIDIFY TRANSPORT — the single factual source of truth.
 *
 * CONTENT RULE: every company fact below comes from the client's supplied
 * information (onboarding paperwork, insurance instructions, direct-deposit
 * authorisation, and the project brief). Nothing here is inferred, rounded
 * or invented.
 *
 * Solidify is an AUTO TRANSPORT MOTOR CARRIER. It is not a broker, not a
 * marketplace, not a load board, not a general-freight carrier. Copy that
 * implies Solidify arranges transport rather than performs it is a defect.
 *
 * What the client has NOT supplied lives in CLIENT_DATA as null. Nothing null
 * renders anywhere: layouts are written to look finished without it.
 */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://solidifytransport.com").replace(/\/$/, "");

export const COMPANY = {
  legalName: "Solidify Transport LLC",
  name: "Solidify Transport",
  descriptor: "Auto Transport Motor Carrier",
  street: "2455 Naglee Rd. #314",
  city: "Tracy",
  state: "CA",
  zip: "95304",
  phone: "(510) 499-4552",
  phoneHref: "tel:+15104994552",
  phoneE164: "+1-510-499-4552",
} as const;

export const ADDRESS_LINES = [COMPANY.street, `${COMPANY.city}, ${COMPANY.state} ${COMPANY.zip}`] as const;
export const ADDRESS_ONE_LINE = `${COMPANY.street}, ${COMPANY.city}, ${COMPANY.state} ${COMPANY.zip}`;

/** The live owner-operator application, hosted off-site. Every "apply" CTA points here. */
export const APPLY_URL = "https://account.neweratitans.com/apply/MTY0MTk=";

/** How an owner-operator is paid. Confirmed. The percentage is NOT public and is never stated. */
export const COMPENSATION = {
  basis: "Compensation is based on a percentage of the line-haul revenue from each load.",
  basisShort: "A percentage of line-haul revenue",
  terms: "Net 30",
} as const;

/** Insurance an owner-operator must carry. Confirmed limits and certificate holder, verbatim. */
export const INSURANCE = {
  certificateHolder: [COMPANY.legalName, ...ADDRESS_LINES] as const,
  requirements: [
    { id: "cargo", label: "Cargo", limit: "$500,000", note: "Minimum" },
    { id: "auto", label: "Commercial automobile liability", limit: "$1,000,000", note: "Combined single limit" },
    { id: "gl-occ", label: "General liability", limit: "$1,000,000", note: "Each occurrence" },
    { id: "gl-agg", label: "General liability", limit: "$1,000,000", note: "Aggregate" },
  ] as const,
} as const;

/** Descriptive, checkable claims. None of them a number we made up. */
export const CLAIMS = {
  coverage: "All 48 contiguous states",
  coverageLong: "Vehicle transport across all 48 contiguous states",
  focus: "Strong Western-US focus",
} as const;

/** Western states, for the coverage visual. Geography only — never a volume or lane claim. */
export const WESTERN_STATES = ["CA", "OR", "WA", "NV", "AZ", "UT", "ID", "MT", "WY", "CO", "NM"] as const;

/**
 * Supplied by the client. Null values are simply not rendered anywhere.
 * Filling one in makes it appear with no layout change.
 */
export const CLIENT_DATA: Record<"usdot" | "mc" | "email", string | null> = {
  usdot: null,
  mc: null,
  email: null,
};

export const has = (key: keyof typeof CLIENT_DATA): boolean => {
  const v = CLIENT_DATA[key];
  return v !== null && v !== undefined && String(v).trim() !== "";
};

/* ───────────────────────────────────────────────────────────── navigation ── */

export const NAV = [
  { href: "/car-shipping", label: "Car Shipping" },
  { href: "/oem-dealerships", label: "OEM & Dealerships" },
  { href: "/owner-operators", label: "Owner Operators" },
  { href: "/about", label: "About" },
] as const;

export const CTA = {
  quote: { href: "/contact", label: "Get a vehicle shipping quote" },
  quoteShort: { href: "/contact", label: "Get a quote" },
  oem: { href: "/oem-dealerships", label: "OEM & dealership solutions" },
  oemInquiry: { href: "/contact?lane=oem", label: "Start a commercial inquiry" },
  drive: { href: "/owner-operators", label: "Drive with Solidify" },
  apply: { href: APPLY_URL, label: "Start a new application" },
} as const;

export const FOOTER_LINKS = {
  services: [
    { href: "/car-shipping", label: "Car Shipping" },
    { href: "/oem-dealerships", label: "OEM & Dealerships" },
    { href: "/contact", label: "Get a Quote" },
  ],
  company: [
    { href: "/about", label: "About Solidify" },
    { href: "/owner-operators", label: "Owner Operators" },
    { href: "/contact", label: "Contact" },
    { href: "/privacy", label: "Privacy" },
  ],
} as const;

/* ─────────────────────────────────────────────────────────────────── SEO ── */

export const META = {
  defaultTitle: "Solidify Transport — Auto Transport Carrier | Nationwide Car Shipping",
  titleTemplate: "%s — Solidify Transport",
  description:
    "Solidify Transport is an auto transport motor carrier moving vehicles for OEMs, dealerships and consumers across all 48 contiguous states, with strong Western US coverage. Get a vehicle shipping quote.",
  keywords: [
    "auto transport carrier",
    "car shipping",
    "vehicle shipping",
    "nationwide car shipping",
    "dealership vehicle transport",
    "OEM vehicle transport",
    "auto transport owner operators",
  ],
} as const;
