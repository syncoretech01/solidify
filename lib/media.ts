/**
 * SOLIDIFY — media registry.
 *
 * Every photograph on the site is addressed by SLOT id, never by path. A
 * section asks for `media("hero-carrier")`; what that resolves to is decided
 * here and nowhere else. When Solidify supplies its own photography, this is
 * the only file that changes.
 *
 * PHOTOS are the vetted masters in assets/media/ (see assets/media/CREDITS.txt
 * for provenance and the vetting record). Every photo was opened at full
 * resolution and examined through magnified crops for competitor livery, US
 * origin and identifiable people before it was admitted.
 *
 * LICENCE — Pexels / Unsplash licences: free for commercial use, no
 * attribution required, and NO model or property release. A person shown in
 * any frame is a stock subject, NOT a Solidify employee, operator or
 * customer, and copy must never imply otherwise.
 *
 * A slot whose `photo` is null renders a designed reserved composition rather
 * than a wrong or weak photograph. `awaiting` records the shot it is reserved
 * for, so a shoot brief reads straight out of this file.
 */

import manifest from "./images.json";

export type Tone = "dark" | "light";

export type Photo = {
  /** Basename in assets/media, without extension. */
  file: string;
  alt: string;
  /** Focal point as [x%, y%] — the subject, measured, never dead-centre. */
  focal: [number, number];
  tone: Tone;
  /** Where it came from — for the credits record. */
  source: string;
  showsPerson?: boolean;
};

export type SlotDef = {
  photo: string | null;
  /** width / height the layout reserves. */
  aspect: number;
  tone: Tone;
  /** The real photograph this slot is reserved for. */
  awaiting: string;
};

/* ───────────────────────────────────────────────────────────── the photos ── */

export const PHOTOS: Record<string, Photo> = {
  // Each entry mirrors a vetted master in assets/media/. Keys are the file
  // basenames. Provenance and the vetting record: assets/media/CREDITS.txt.
  "carrier-corvettes-highway": {
    file: "carrier-corvettes-highway",
    alt: "A loaded car carrier travelling an open highway, its upper deck stacked with new vehicles under protective transit covers.",
    focal: [66, 58],
    tone: "light",
    source: "Unsplash BSL-V0TRSSo — Roger Starnes Sr (I-71, Ohio; bottom strip cropped)",
  },
  "carrier-deck-socal": {
    file: "carrier-deck-socal",
    alt: "The upper deck of a car carrier in Southern California — an SUV, a Jeep and a sedan secured against a storm sky.",
    focal: [54, 62],
    tone: "light",
    source: "Unsplash LrDsApWs3C0 — Craig Marolf (Southern California; upper deck crop)",
  },
  "carrier-interstate-transit": {
    file: "carrier-interstate-transit",
    alt: "A car carrier at speed on a divided interstate, new vehicles in transit covers stacked on both decks.",
    focal: [37, 64],
    tone: "light",
    source: "Unsplash RQlbiwT4Zgs — Roger Starnes Sr (I-71; right-side crop)",
  },
  "supra-trailer-straps": {
    file: "supra-trailer-straps",
    alt: "A black sports car strapped down on an open trailer deck, yellow ratchet straps at the wheels.",
    focal: [50, 46],
    tone: "dark",
    source: "Pexels 12330350 — Jacob Moore (Colorado)",
  },
  "lot-chattanooga-aerial": {
    file: "lot-chattanooga-aerial",
    alt: "Rows of new vehicles staged on a storage lot in Chattanooga, Tennessee, seen from directly above.",
    focal: [58, 45],
    tone: "light",
    source: "Pexels 4204153 — K (Chattanooga, TN)",
  },
  "lot-dealer-row": {
    file: "lot-dealer-row",
    alt: "A row of premium sedans parked nose-in on a dealership lot.",
    focal: [45, 40],
    tone: "light",
    source: "Unsplash NFz9uZ8CtKM — Koons Automotive (Virginia / Maryland)",
  },
  "showroom-mc20": {
    file: "showroom-mc20",
    alt: "A white supercar on the floor of a modern glass-walled showroom.",
    focal: [56, 66],
    tone: "light",
    source: "Pexels 12565887 — Jacob Moore (Colorado)",
    showsPerson: true,
  },
  "hands-wheel-detail": {
    file: "hands-wheel-detail",
    alt: "A hand wipes down a polished alloy wheel on a red car during a walk-around check.",
    focal: [61, 58],
    tone: "dark",
    source: "Pexels 17623850 — Malcolm Garret (Ho-Ho-Kus, NJ)",
    showsPerson: true,
  },
  "detail-amg-wheel": {
    file: "detail-amg-wheel",
    alt: "A black five-spoke alloy wheel with a red brake caliper behind the spokes.",
    focal: [46, 50],
    tone: "dark",
    source: "Unsplash FsBbavP9YA4 — Jakob Rosen (Denver, CO)",
  },
  "detail-cadillac-crest": {
    file: "detail-cadillac-crest",
    alt: "A Cadillac crest on the tailgate of a champagne-coloured SUV.",
    focal: [45, 57],
    tone: "dark",
    source: "Unsplash IQTkDY7xrmU — Jakob Rosen (Denver, CO)",
  },
  "road-utah-canyon": {
    file: "road-utah-canyon",
    alt: "An interstate winding through a red-rock canyon toward the open high desert of Utah.",
    focal: [70, 78],
    tone: "light",
    source: "Unsplash kkbhlly5G2Y — Anguel Hristozov (Utah)",
  },
  "road-death-valley": {
    file: "road-death-valley",
    alt: "A straight two-lane highway running toward desert mountains in California's Death Valley.",
    focal: [50, 68],
    tone: "light",
    source: "Pexels 33569802 — Aomata (California)",
  },
  "road-north-cascades": {
    file: "road-north-cascades",
    alt: "A mountain highway curving through pine forest below granite peaks in Washington's North Cascades.",
    focal: [30, 70],
    tone: "light",
    source: "Pexels 35000374 — Timberly Hawkins (Washington)",
  },
  "road-utah-night": {
    file: "road-utah-night",
    alt: "Headlight trails on a mountain highway winding through a snow-dusted Utah valley at night.",
    focal: [40, 76],
    tone: "dark",
    source: "Unsplash Oy84q0IlQ_4 — Patrick Hendry (Utah)",
  },
};

/* ────────────────────────────────────────────────────────────── the slots ── */

export const SLOTS = {
  /* ---- Home ------------------------------------------------------------ */
  "hero-carrier": {
    photo: "carrier-corvettes-highway",
    aspect: 16 / 9,
    tone: "dark",
    awaiting: "HERO. A loaded car carrier on an open Western highway, subject in the lower-right third, sky restrained. The first thing anyone sees.",
  },
  "home-what": {
    photo: "supra-trailer-straps",
    aspect: 4 / 5,
    tone: "dark",
    awaiting: "Vehicles secured on a carrier deck — straps, ramps, the equipment doing the work.",
  },
  "home-car-shipping": {
    photo: null,
    aspect: 16 / 10,
    tone: "dark",
    awaiting: "A vehicle being driven or winched onto a carrier.",
  },
  "home-oem": {
    photo: "lot-dealer-row",
    aspect: 16 / 10,
    tone: "light",
    awaiting: "Dealership inventory — rows of new vehicles on a lot.",
  },
  "home-coverage": {
    photo: "road-utah-canyon",
    aspect: 21 / 9,
    tone: "dark",
    awaiting: "A Western road environment: high desert or mountain highway, wide, no branded vehicle.",
  },
  "home-trust": {
    photo: "hands-wheel-detail",
    aspect: 4 / 5,
    tone: "dark",
    awaiting: "Condition inspection detail — hands, clipboard or a walk-around at pickup.",
  },
  "home-operator": {
    photo: null,
    aspect: 16 / 10,
    tone: "dark",
    awaiting: "A professional driver at a car carrier. A stock subject; never captioned as a Solidify operator.",
  },
  "home-cta": {
    photo: "road-utah-night",
    aspect: 16 / 9,
    tone: "dark",
    awaiting: "A car carrier at dusk or on a long highway — the closing frame.",
  },

  /* ---- Process (shared by home and car shipping, max two uses each) ---- */
  "process-pickup": {
    photo: "supra-trailer-straps",
    aspect: 4 / 5,
    tone: "dark",
    awaiting: "Pickup: a vehicle at the point of loading.",
  },
  "process-transit": {
    photo: "carrier-interstate-transit",
    aspect: 4 / 5,
    tone: "dark",
    awaiting: "Transit: a loaded carrier at speed on the interstate.",
  },
  "process-delivery": {
    photo: null,
    aspect: 4 / 5,
    tone: "dark",
    awaiting: "Delivery: a vehicle coming off the ramp.",
  },

  /* ---- Car shipping ---------------------------------------------------- */
  "cs-hero": {
    photo: "carrier-deck-socal",
    aspect: 16 / 9,
    tone: "dark",
    awaiting: "A vehicle on a carrier, close and premium.",
  },
  "cs-loading": {
    photo: null,
    aspect: 4 / 5,
    tone: "dark",
    awaiting: "Loading action — ramp down, vehicle moving onto the deck.",
  },
  "cs-situations": {
    photo: "detail-cadillac-crest",
    aspect: 16 / 10,
    tone: "dark",
    awaiting: "A premium vehicle detail — wheel, badge or body line.",
  },
  "cs-quote-ground": {
    photo: "road-death-valley",
    aspect: 21 / 9,
    tone: "dark",
    awaiting: "A road environment behind the quote form.",
  },

  /* ---- OEM & dealerships ----------------------------------------------- */
  "oem-hero": {
    photo: "lot-chattanooga-aerial",
    aspect: 16 / 9,
    tone: "dark",
    awaiting: "Rows of new vehicles staged for transport, or a carrier loaded with new inventory.",
  },
  "oem-environment": {
    photo: "showroom-mc20",
    aspect: 4 / 5,
    tone: "light",
    awaiting: "A modern dealership or OEM environment — showroom or delivery area.",
  },
  "oem-movement": {
    photo: "carrier-interstate-transit",
    aspect: 16 / 10,
    tone: "dark",
    awaiting: "A carrier loaded with new vehicles.",
  },
  "oem-cta": {
    photo: null,
    aspect: 21 / 9,
    tone: "dark",
    awaiting: "Dealership lot at dusk, or a carrier departing.",
  },

  /* ---- Owner operators ------------------------------------------------- */
  "oo-hero": {
    photo: null,
    aspect: 16 / 9,
    tone: "dark",
    awaiting: "An owner-operator with a car carrier. A stock subject; never captioned as a Solidify operator.",
  },
  "oo-driver": {
    photo: null,
    aspect: 4 / 5,
    tone: "dark",
    awaiting: "A professional driver at work — cab, mirror, strap check.",
  },
  "oo-equipment": {
    photo: null,
    aspect: 16 / 10,
    tone: "dark",
    awaiting: "Car hauler equipment detail — deck, hydraulics, ramps.",
  },

  /* ---- About ----------------------------------------------------------- */
  "about-hero": {
    photo: "carrier-deck-socal",
    aspect: 16 / 9,
    tone: "dark",
    awaiting: "A carrier in a Western landscape.",
  },
  "about-detail": {
    photo: "detail-amg-wheel",
    aspect: 4 / 5,
    tone: "dark",
    awaiting: "A premium vehicle detail.",
  },
  "about-coverage": {
    photo: "road-north-cascades",
    aspect: 16 / 10,
    tone: "dark",
    awaiting: "A second Western road environment, different geography from home-coverage.",
  },

  /* ---- Contact --------------------------------------------------------- */
  "contact-hero": {
    photo: "carrier-corvettes-highway",
    aspect: 16 / 9,
    tone: "dark",
    awaiting: "A carrier or loaded vehicle — calm, composed, room for the form.",
  },
} as const satisfies Record<string, SlotDef>;

export type MediaId = keyof typeof SLOTS;

export type ManifestEntry = {
  width: number;
  height: number;
  aspect: number;
  widths: number[];
  formats: string[];
};

export type ResolvedMedia = {
  id: MediaId;
  photo: Photo | null;
  manifest: ManifestEntry | null;
  aspect: number;
  tone: Tone;
  awaiting: string;
};

const MANIFEST = manifest as Record<string, ManifestEntry>;

/** Resolve a slot. Unknown ids throw in development so a typo cannot ship. */
export function media(id: MediaId): ResolvedMedia {
  const slot = SLOTS[id] as SlotDef | undefined;
  if (!slot) {
    if (process.env.NODE_ENV !== "production") throw new Error(`media(): unknown slot "${id}"`);
    return { id, photo: null, manifest: null, aspect: 16 / 9, tone: "dark", awaiting: "" };
  }
  const photo = slot.photo ? (PHOTOS[slot.photo] ?? null) : null;
  const entry = photo ? (MANIFEST[photo.file] ?? null) : null;
  return {
    id,
    photo: entry ? photo : null,
    manifest: entry,
    aspect: slot.aspect,
    tone: slot.tone,
    awaiting: slot.awaiting,
  };
}

/** Slots still waiting on photography — read by the handover report. */
export const outstandingMedia = () =>
  (Object.keys(SLOTS) as MediaId[])
    .filter((id) => media(id).photo === null)
    .map((id) => ({ id, awaiting: SLOTS[id].awaiting }));

/** How many slots each photo carries — the QA harness enforces max two. */
export const photoUsage = () => {
  const counts: Record<string, MediaId[]> = {};
  for (const id of Object.keys(SLOTS) as MediaId[]) {
    const p = SLOTS[id].photo;
    if (p) (counts[p] ||= []).push(id);
  }
  return counts;
};
