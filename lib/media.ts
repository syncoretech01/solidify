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
  /* ── the carrier, loaded and moving ─────────────────────────────────── */

  "carrier-corvettes-highway": {
    file: "carrier-corvettes-highway",
    alt: "A loaded auto-transport carrier on a highway, sports cars under white transit covers strapped across its upper and lower decks.",
    focal: [66, 58],
    tone: "light",
    source: "Unsplash BSL-V0TRSSo — Roger Starnes Sr (I-71, Ohio; bottom strip cropped)",
  },
  "deck-corvette-detail": {
    file: "deck-corvette-detail",
    alt: "Two sports cars under fitted transit covers secured side by side on the upper deck of a car carrier, orange uprights framing them.",
    focal: [45, 55],
    tone: "light",
    source: "Unsplash BSL-V0TRSSo — Roger Starnes Sr (upper-deck crop of the same frame)",
  },
  "carrier-interstate-transit": {
    file: "carrier-interstate-transit",
    alt: "Covered vehicles riding on a car carrier in transit, deck rails and tie-downs visible along the trailer.",
    focal: [37, 64],
    tone: "light",
    source: "Unsplash RQlbiwT4Zgs — Roger Starnes Sr (I-71; right-side crop)",
  },
  "carrier-deck-socal": {
    file: "carrier-deck-socal",
    alt: "An SUV and a four-door off-roader loaded on the deck of a car carrier against an overcast sky.",
    focal: [54, 62],
    tone: "light",
    source: "Unsplash LrDsApWs3C0 — Craig Marolf (Southern California; upper deck crop)",
  },
  "deck-socal-detail": {
    file: "deck-socal-detail",
    alt: "Three vehicles standing on the upper deck of a car carrier, wheels seated on the steel grating.",
    focal: [45, 58],
    tone: "light",
    source: "Unsplash LrDsApWs3C0 — Craig Marolf (deck-level crop of the same frame)",
  },

  /* ── loading, securing, the equipment ───────────────────────────────── */

  "deck-strapped-sedan": {
    file: "deck-strapped-sedan",
    alt: "A new sedan standing on the angled deck of a car carrier, its wheels held by a ratchet strap over the steel grating.",
    focal: [62, 52],
    tone: "light",
    source: "Pexels 29566910 — Ivan Zhukevich (cropped to the deck; no lettering in frame)",
  },
  "supra-trailer-straps": {
    file: "supra-trailer-straps",
    alt: "A sports car secured on a transport deck, wheel straps drawn tight through the tie-down rails.",
    focal: [50, 46],
    tone: "dark",
    source: "Pexels 12330350 — Jacob Moore (Colorado)",
  },
  "strap-wheel-detail": {
    file: "strap-wheel-detail",
    alt: "A wheel strap ratcheted down to the deck rail beside a loaded vehicle, the trailer's marker tape below.",
    focal: [45, 52],
    tone: "dark",
    source: "Pexels 12330350 — Jacob Moore (tie-down crop of the same frame)",
  },
  "deck-aerial-yard": {
    file: "deck-aerial-yard",
    alt: "A car carrier's empty decks and loading ramps seen from directly above, grating and tie-down rails running the length of the trailer.",
    focal: [50, 55],
    tone: "light",
    source: 'Wikimedia Commons "Car carrier trailer 2" — Wikideas1, CC0 (cropped)',
  },
  "deck-ramp-detail": {
    file: "deck-ramp-detail",
    alt: "The ramps and upper deck of a car carrier from above, hydraulic rams and walkway grating in close detail.",
    focal: [38, 46],
    tone: "light",
    source: 'Wikimedia Commons "Car carrier trailer 2" — Wikideas1, CC0 (ramp crop of the same frame)',
  },

  /* ── inventory, yards and destinations ──────────────────────────────── */

  "lot-chattanooga-aerial": {
    file: "lot-chattanooga-aerial",
    alt: "Rows of new vehicles staged in a distribution yard, seen from the air.",
    focal: [58, 45],
    tone: "light",
    source: "Pexels 4204153 — K (Chattanooga, TN)",
  },
  "lot-rows-detail": {
    file: "lot-rows-detail",
    alt: "Ranks of new vehicles standing nose to tail in a staging yard, seen from above.",
    focal: [50, 45],
    tone: "light",
    source: "Pexels 4204153 — K (Chattanooga, TN; tighter crop of the same frame)",
  },
  "lot-chevrolet-covers": {
    file: "lot-chevrolet-covers",
    alt: "New vehicles in a staging lot with white transit roof covers and window stickers still fitted.",
    focal: [55, 52],
    tone: "light",
    source: "Unsplash 1h491Giz9CU — Rob Dean (new-vehicle staging lot)",
  },
  "lot-covers-detail": {
    file: "lot-covers-detail",
    alt: "Transit covers and factory window stickers on new vehicles waiting to be moved.",
    focal: [54, 44],
    tone: "light",
    source: "Unsplash 1h491Giz9CU — Rob Dean (detail crop of the same frame)",
  },
  "lot-dealer-row": {
    file: "lot-dealer-row",
    alt: "Vehicles lined up on the ground at their destination, ready to be handed over.",
    focal: [45, 40],
    tone: "light",
    source: "Unsplash NFz9uZ8CtKM — Koons Automotive (Virginia / Maryland)",
  },
};

/* ────────────────────────────────────────────────────────────── the slots ── */
/**
 * One slot, one place. Every photograph carries exactly two page:slot uses,
 * which is the ceiling QA enforces — nothing on this site repeats a third time.
 */

export const SLOTS = {
  /* Home */
  "hero-carrier": { photo: "carrier-corvettes-highway", aspect: 16 / 9, tone: "dark", role: "HERO — the loaded carrier; the WebGL scene is built on it." },
  "lane-consumer": { photo: "deck-strapped-sedan", aspect: 4 / 5, tone: "dark", role: "Lanes — one customer vehicle, secured." },
  "lane-oem": { photo: "lot-chevrolet-covers", aspect: 4 / 5, tone: "light", role: "Lanes — new-vehicle inventory with transit covers." },
  "lane-operator": { photo: "deck-ramp-detail", aspect: 4 / 5, tone: "light", role: "Lanes — the equipment an owner-operator runs." },
  statement: { photo: "carrier-deck-socal", aspect: 2, tone: "dark", role: "Statement — vehicles on a carrier deck, full-bleed." },
  "seq-pickup": { photo: "supra-trailer-straps", aspect: 16 / 9, tone: "dark", role: "Sequence 01 — secured at pickup." },
  "seq-transit": { photo: "carrier-interstate-transit", aspect: 16 / 9, tone: "dark", role: "Sequence 02 — on the carrier." },
  "seq-delivery": { photo: "lot-dealer-row", aspect: 16 / 9, tone: "dark", role: "Sequence 03 — at the destination." },
  "home-oem": { photo: "lot-chattanooga-aerial", aspect: 16 / 11, tone: "light", role: "Home OEM feature — staged inventory from above." },
  "home-sheet": { photo: "deck-corvette-detail", aspect: 4 / 3, tone: "dark", role: "Carrier sheet — the deck, close." },
  closing: { photo: "deck-socal-detail", aspect: 16 / 9, tone: "dark", role: "Closing scene — vehicles on the deck." },

  /* Car shipping */
  "cs-hero": { photo: "carrier-deck-socal", aspect: 16 / 9, tone: "dark", role: "Car-shipping hero — vehicles on the carrier deck." },
  "cs-situation-1": { photo: "strap-wheel-detail", aspect: 4 / 5, tone: "dark", role: "Scenario — relocating: the vehicle strapped down." },
  "cs-situation-2": { photo: "deck-strapped-sedan", aspect: 4 / 5, tone: "dark", role: "Scenario — buying out of state: a car loaded for the trip." },
  "cs-situation-3": { photo: "lot-covers-detail", aspect: 4 / 5, tone: "light", role: "Scenario — seasonal moves: covers and stickers." },
  "cs-situation-4": { photo: "deck-corvette-detail", aspect: 4 / 5, tone: "dark", role: "Scenario — students and military: covered vehicles on the deck." },
  "cs-situation-5": { photo: "lot-dealer-row", aspect: 4 / 5, tone: "light", role: "Scenario — family vehicles: a vehicle delivered and handed over." },
  "cs-situation-6": { photo: "lot-rows-detail", aspect: 4 / 5, tone: "light", role: "Scenario — dealer transfers: dealer inventory ready to move." },
  "quote-ground": { photo: "deck-aerial-yard", aspect: 21 / 9, tone: "dark", role: "Quote console rail — the decks from above, dimmed." },

  /* OEM & dealerships */
  "oem-hero": { photo: "lot-chattanooga-aerial", aspect: 16 / 9, tone: "dark", role: "OEM hero — vehicles staged for transport." },
  "oem-role": { photo: "lot-chevrolet-covers", aspect: 2, tone: "dark", role: "Role statement — inventory with transit covers, full-bleed." },
  "oem-board": { photo: "lot-rows-detail", aspect: 16 / 9, tone: "dark", role: "Movement board backdrop — inventory depth behind the network." },

  /* Owner-operators */
  "oo-hero": { photo: "carrier-corvettes-highway", aspect: 16 / 9, tone: "dark", role: "Owner-operator hero — the loaded carrier." },
  "road-1": { photo: "deck-ramp-detail", aspect: 16 / 10, tone: "light", role: "Road 01 — the decks and ramps you run." },
  "road-2": { photo: "strap-wheel-detail", aspect: 16 / 10, tone: "dark", role: "Road 03 — securing the load." },

  /* Become a driver */
  "driver-hero": { photo: "deck-aerial-yard", aspect: 16 / 9, tone: "dark", role: "Driver hero — the equipment, from above." },
  "driver-rail": { photo: "lot-covers-detail", aspect: 4 / 5, tone: "light", role: "Driver journey rail — the vehicles you move." },

  /* About */
  "about-hero": { photo: "deck-socal-detail", aspect: 16 / 9, tone: "dark", role: "About hero — vehicles on the deck, layered." },
  "about-identity": { photo: "supra-trailer-straps", aspect: 4 / 5, tone: "dark", role: "Identity plate — a vehicle secured for transport." },

  /* Contact */
  "contact-rail": { photo: "carrier-interstate-transit", aspect: 4 / 5, tone: "dark", role: "Contact console rail — the carrier in transit, dimmed." },
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
