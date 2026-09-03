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
 * LICENCE — Pexels / Unsplash licences and CC0: free for commercial use, no
 * model or property release. A person shown in any frame is a stock subject,
 * NOT a Solidify employee, operator or customer, and copy must never imply
 * otherwise.
 *
 * A public slot must resolve to a vetted photograph — nothing reserved ever
 * ships. Each photograph carries at most two page:slot uses (QA-enforced).
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
  photo: string;
  /** width / height the layout reserves. */
  aspect: number;
  tone: Tone;
  /** What this slot shows, for the handover record. */
  role: string;
};

/* ───────────────────────────────────────────────────────────── the photos ── */

export const PHOTOS: Record<string, Photo> = {
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
  "lot-chevrolet-covers": {
    file: "lot-chevrolet-covers",
    alt: "Rows of new Chevrolet SUVs on a staging lot, white transit covers on their roofs and window stickers still in place.",
    focal: [55, 52],
    tone: "light",
    source: "Unsplash 1h491Giz9CU — Rob Dean (new-vehicle staging lot)",
  },
  "deck-aerial-yard": {
    file: "deck-aerial-yard",
    alt: "A drone view of an empty car hauler's decks, ramps and uprights parked on a concrete yard.",
    focal: [50, 55],
    tone: "light",
    source: "Wikimedia Commons “Car carrier trailer 2” — Wikideas1, CC0 (Midwest yard; cropped)",
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
  "hero-carrier": { photo: "carrier-corvettes-highway", aspect: 16 / 9, tone: "dark", role: "HERO — the loaded hauler on the highway; the WebGL scene is built on it." },
  "lane-consumer": { photo: "detail-cadillac-crest", aspect: 4 / 5, tone: "dark", role: "Lanes — the consumer's vehicle." },
  "lane-oem": { photo: "lot-chevrolet-covers", aspect: 4 / 5, tone: "light", role: "Lanes — new-vehicle inventory with transit covers." },
  "lane-operator": { photo: "deck-aerial-yard", aspect: 4 / 5, tone: "light", role: "Lanes — the equipment an owner-operator runs." },
  statement: { photo: "carrier-deck-socal", aspect: 2, tone: "dark", role: "Statement — vehicles secured on a carrier deck, full-bleed." },
  "seq-pickup": { photo: "supra-trailer-straps", aspect: 16 / 9, tone: "dark", role: "Sequence 01 — a vehicle secured at pickup." },
  "seq-transit": { photo: "carrier-interstate-transit", aspect: 16 / 9, tone: "dark", role: "Sequence 02 — the carrier in transit." },
  "seq-delivery": { photo: "lot-dealer-row", aspect: 16 / 9, tone: "dark", role: "Sequence 03 — vehicles at the destination." },
  "home-oem": { photo: "lot-chattanooga-aerial", aspect: 16 / 11, tone: "light", role: "Home OEM feature — staged inventory from above." },
  closing: { photo: "road-utah-night", aspect: 16 / 9, tone: "dark", role: "Closing — road light at night (home, owner-operators)." },

  /* ---- Car shipping ---------------------------------------------------- */
  "cs-hero": { photo: "carrier-deck-socal", aspect: 16 / 9, tone: "dark", role: "Car-shipping hero — vehicles on the carrier deck." },
  "cs-situation-1": { photo: "road-utah-canyon", aspect: 4 / 5, tone: "dark", role: "Situations — relocating: the road West." },
  "cs-situation-2": { photo: "road-north-cascades", aspect: 4 / 5, tone: "dark", role: "Situations — seasonal moves: a mountain highway." },
  "cs-situation-3": { photo: "detail-cadillac-crest", aspect: 4 / 5, tone: "dark", role: "Situations — family vehicles: a premium vehicle detail." },
  "quote-ground": { photo: "road-death-valley", aspect: 21 / 9, tone: "dark", role: "Quote console rail — a Western road, dimmed." },

  /* ---- OEM & dealerships ----------------------------------------------- */
  "oem-hero": { photo: "lot-chattanooga-aerial", aspect: 16 / 9, tone: "dark", role: "OEM hero — rows of new vehicles staged for transport." },
  "oem-role": { photo: "lot-chevrolet-covers", aspect: 2, tone: "dark", role: "Role statement — inventory with transit covers, full-bleed." },

  /* ---- Owner operators ------------------------------------------------- */
  "oo-hero": { photo: "carrier-corvettes-highway", aspect: 16 / 9, tone: "dark", role: "Owner-operator hero — the loaded hauler." },
  "road-1": { photo: "deck-aerial-yard", aspect: 16 / 10, tone: "light", role: "Road 01 — the hauler's decks and ramps from above." },

  /* ---- Contact --------------------------------------------------------- */
  "contact-rail": { photo: "road-death-valley", aspect: 4 / 5, tone: "dark", role: "Contact console rail — a Western road, dimmed." },
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
  role: string;
};

const MANIFEST = manifest as Record<string, ManifestEntry>;

/** Resolve a slot. Unknown ids and missing masters throw — a typo cannot ship. */
export function media(id: MediaId): ResolvedMedia {
  const slot = SLOTS[id] as SlotDef | undefined;
  if (!slot) throw new Error(`media(): unknown slot "${id}"`);
  const photo = PHOTOS[slot.photo] ?? null;
  const entry = photo ? (MANIFEST[photo.file] ?? null) : null;
  if (!photo || !entry) throw new Error(`media(): slot "${id}" → "${slot.photo}" has no master in lib/images.json (run npm run images)`);
  return { id, photo, manifest: entry, aspect: slot.aspect, tone: slot.tone, role: slot.role };
}

/** How many slots each photo carries — the QA harness enforces max two page:slot uses. */
export const photoUsage = () => {
  const counts: Record<string, MediaId[]> = {};
  for (const id of Object.keys(SLOTS) as MediaId[]) {
    const p = SLOTS[id].photo;
    (counts[p] ||= []).push(id);
  }
  return counts;
};

/** Photographs with no slot — kept as masters, not served. */
export const unusedPhotos = () => {
  const used = new Set<string>(Object.values(SLOTS).map((s) => s.photo as string));
  return Object.keys(PHOTOS).filter((p) => !used.has(p));
};
