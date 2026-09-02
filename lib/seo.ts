import type { Metadata } from "next";
import { SITE_URL, COMPANY, META } from "@/lib/site";

/** Per-page metadata with a unique title, description, canonical and OG/Twitter card. */
export function pageMetadata({
  title,
  description,
  path,
  image = "/opengraph-image",
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
}): Metadata {
  const url = `${SITE_URL}${path === "/" ? "" : path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName: COMPANY.name,
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: `${COMPANY.name} — ${COMPANY.descriptor}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

/* ── Structured data — only what is factually valid. ──────────────────────
   No AggregateRating, no Review: there is no real review data and inventing
   it is both a fabrication and a structured-data policy violation. Every
   value here is generated from lib/site.ts so it can never drift from copy. */

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness"],
    "@id": `${SITE_URL}/#carrier`,
    name: COMPANY.legalName,
    alternateName: COMPANY.name,
    description: META.description,
    url: SITE_URL,
    telephone: COMPANY.phoneE164,
    image: `${SITE_URL}/opengraph-image`,
    logo: `${SITE_URL}/icon.png`,
    address: {
      "@type": "PostalAddress",
      streetAddress: COMPANY.street,
      addressLocality: COMPANY.city,
      addressRegion: COMPANY.state,
      postalCode: COMPANY.zip,
      addressCountry: "US",
    },
    areaServed: { "@type": "Country", name: "United States" },
    knowsAbout: ["Auto transport", "Vehicle shipping", "Car shipping", "Dealership vehicle transport", "OEM vehicle transport"],
  };
}

export function serviceLd({ name, description, path }: { name: string; description: string; path: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url: `${SITE_URL}${path}`,
    serviceType: "Vehicle transport",
    provider: { "@id": `${SITE_URL}/#carrier` },
    areaServed: { "@type": "Country", name: "United States" },
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path === "/" ? "" : it.path}`,
    })),
  };
}

export function faqLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}
