# Solidify Transport

The website of **Solidify Transport LLC**, an auto transport motor carrier moving
vehicles for OEMs, dealerships and consumers across all 48 contiguous states,
with strong Western-US coverage.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · GSAP (ScrollTrigger,
SplitText, DrawSVG, Flip, MotionPath) + Lenis · Three.js (hero only) · Zod ·
react-hook-form · Playwright (headless QA).

```bash
npm install
npm run dev          # http://localhost:3000 (this machine uses -p 3477)
npm run images       # AVIF/WebP/JPEG ladder from assets/media (build runs this)
npm run masks        # hero scene masks from lib/hero-scene.json (build runs this)
npm run build        # production build
npm start
npm run typecheck
npm run qa           # headless multi-viewport QA (see below) — needs a running server
node scripts/peek.mjs car-shipping 1536 864 8   # quick headless look at one route
node scripts/mail-sink.mjs 3479          # a local stand-in for the mail provider
node scripts/mail-sink.mjs 3479 --fail   # …that refuses, for the delivery-failure phase
npm run env:local    # LOCAL ONLY: .env.local + a test access code, pointed at the sink
npm run onboarding:smoke -- http://localhost:3477 --phase unconfigured|configured|delivery-failure
npm run onboarding:ui -- http://localhost:3477   # headless UI check of the stepper (needs SMOKE_ACCESS_CODE)
```

Local verification, end to end: start the mail sink, run `npm run env:local`
(it prints a test access code and writes a gitignored `.env.local` pointed at
the sink), restart `next dev`, then run all three smoke phases, the UI check
and `npm run qa`. Remove it again with `npm run env:local -- --remove`.
Rate limits are real even locally; the smoke test gives each request its own
`x-forwarded-for` so a 429 never stands in for the answer under test.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Homepage — hero scene, audience lanes, statement, pickup→transit→delivery sequence, coverage, carrier sheet, closing |
| `/car-shipping` | Consumer + commercial vehicle shipping, situations strip, quote console with route map, FAQ |
| `/oem-dealerships` | OEM, dealership and dealer-group transport, the movement board, commercial inquiry |
| `/owner-operators` | Recruiting road, **two paths** (considering it → `/become-a-driver`; approved → secure onboarding on the same page) |
| `/become-a-driver` | The driver opportunity, requirements, the seven-stage application journey, and the hand-off to the external portal |
| `/about` | Company identity, coverage, how it operates |
| `/contact` | Two separated inquiry lanes, contact details, and the driver pathway |
| `/privacy` | Privacy notice |
| `/api/*` | Inquiry + onboarding pipelines — see `lib/server/README.md` |

## Frontend system

Seven signature experiences carry the bespoke motion; everything else is built
from one editorial system so secondary sections stay consistent without
looking identical.

| Signature | Where | File |
| --- | --- | --- |
| Hero scene (the only WebGL) | `/` | `components/home/Hero.tsx`, `components/webgl/HeroScene.tsx`, masks from `lib/hero-scene.json` via `scripts/masks.mjs` |
| Lanes (Flip) | `/` | `components/home/Lanes.tsx` |
| Sequence (pinned, three beats) | `/`, `/car-shipping` | `components/home/Sequence.tsx` |
| Coverage map (DrawSVG, pointer light) | `/`, `/car-shipping`, `/oem-dealerships`, `/about` | `components/blocks/CoverageMap.tsx` |
| Movement board (DrawSVG + MotionPath) | `/oem-dealerships` | `components/oem/MovementBoard.tsx` |
| Road (pinned horizontal) | `/owner-operators` | `components/operators/Road.tsx` |
| Closing (CTA + footer as one scene) | every page | `components/layout/Closing.tsx` |

Editorial system: `components/ui/Editorial.tsx` (`feature` · `statement` ·
`plate` · `ledger`), `SectionHead` patterns (`editorial` · `index` · `caption` ·
`stack`), `SpecStrip`, `LightSweep`, `PageHero`, `FormConsole`. Consecutive
sections must not repeat a heading pattern (`data-head`, QA-asserted).

There is no drawing system. An earlier version carried the loading, unloading
and equipment beats with a line-drawn auto hauler; it became the brand rather
than a support to it, so it was retired. Where a photograph does not exist,
the answer is a composition built from photography — a graded crop, a mask, a
route line, a telemetry card — never line art, and never a figure caption.

Type: **Inter Tight** for display (500–550, never stretched), **Manrope** for
body and UI, IBM Plex Mono for functional metadata only. QA fails any display
element computing a weight above 560, any `font-stretch` other than 100%, and
any `h1` above 88px.

Palette: midnight grounds, graphite/gunmetal plates, brushed-steel and ice
controls; blue exists only as light (`glow-*` at alpha). No control has a blue
fill (QA-asserted). Tokens live in `app/globals.css`.

## What may be said on this site

Solidify is a **motor carrier that transports vehicles**. Not a broker, not a
marketplace, not a load board, not a general-freight carrier. Copy that implies
Solidify arranges transport rather than performs it is a defect, and the QA
harness fails the build on broker phrasing. "Not a broker" appears at most
twice site-wide.

Geography is always **"strong Western-US focus / coverage"** — never
"deepest", "strongest", "density" or any comparative. Nothing is inferred from
the address ("company location", never "home base").

Every company fact lives in `lib/site.ts` and nowhere else. Confirmed:

| Fact | Value |
| --- | --- |
| Legal name | Solidify Transport LLC |
| Address | 2455 Naglee Rd. #314, Tracy, CA 95304 |
| Phone | (510) 499-4552 |
| Coverage | All 48 contiguous states; strong Western-US focus |
| Owner-operator compensation | A percentage of line-haul revenue (**the percentage is not public — never invent it**) |
| Payment terms | Net 30 |
| Insurance minimums | Cargo $500,000 · Commercial auto liability $1,000,000 CSL · GL $1,000,000 each occurrence / $1,000,000 general aggregate; certificate holder shown as **additional insured**, sent from the insurance agent |
| Certificate holder | Solidify Transport LLC, 2455 Naglee Rd. #314, Tracy, CA 95304 |
| Driver application | `APPLY_URL` (external New Era Titans portal) |

Not supplied, therefore not rendered anywhere (`CLIENT_DATA` nulls): USDOT and
MC numbers, a public email address. Nothing on the site asserts fleet size,
years in business, safety ratings, transit guarantees, tracking, open/enclosed
equipment, operable/inoperable capability, inspection procedures, on-time
figures, testimonials or awards. The insurance PDF carries a "$2,000,000"
annotation beside the GL aggregate line; the confirmed $1,000,000 is used.

## Onboarding (from the client's three PDFs)

Profile and Equipment mirror the Carrier Profile Information Sheet ("Truck /
Power Unit", never "tractor"; the sheet's rate and payment lines are shown
read-only). Insurance carries the Insurance Instructions verbatim in substance
(certificate holder as additional insured, sent from the agent, the four
minimums). The W-9 is upload-only against the official IRS form. Direct deposit
collects every field on the Direct Deposit Authorization form, with the
authorization statement verbatim (deposits **and** debits / corrective
actions), stores the exact text and version consented to, and only makes a
field mandatory where the form or the ACH workflow requires it.

## Photography

Masters live in `assets/media/` (committed, never served). `npm run images`
writes the responsive ladder to `public/media/gen/` (gitignored) and a
manifest of **measured** dimensions to `lib/images.json`. Every image reaches
the page through `<Plate slot="…">`, which resolves a slot in `lib/media.ts`.
**A public slot must resolve to a vetted photograph — nothing reserved ever
ships**; a slot without one throws. Each photograph carries at most two
page:slot uses (QA-asserted).

`assets/media/CREDITS.txt` records provenance and the vetting evidence for
every frame: no competitor livery, US origin positively established, no
renders. People in frames are stock subjects and are never captioned as
Solidify staff.

**That file is internal.** There is no public photography-credit page, section
or link anywhere on the site, and QA fails the build if a credit string or a
`#credits` link reappears. The shoot brief for Solidify's own photography (a
loaded hauler with its own livery, loading, unloading, a driver at the
equipment, a handover) is at the end of that file.

## Security posture (short version)

**This site keeps no submission record.** Quote inquiries and approved-driver
onboarding are validated, checked and then delivered to Solidify by email.
There is no database, no object store and no encryption-at-rest key, because
there is nothing at rest. The email is the record.

The onboarding wizard therefore holds its six steps and its three documents in
browser memory until the applicant submits; everything travels in one multipart
request. Preserved: origin checks that fail closed, double-submit CSRF, per-route
rate limits, magic-byte sniffing with the declared type required to agree, no
executable uploads, server-generated attachment filenames, an unconditional log
redactor, masked secret fields that are never `type="password"`, nothing in
`localStorage`/`sessionStorage`/IndexedDB, and `no-store` on every API response.

**The only route to a 200 is a 2xx from the mail provider.** A refused delivery
answers 502 and says plainly that nothing was saved; the applicant's answers and
documents stay on the page so a retry costs nothing. **If delivery is not
configured, every write returns 503 and the UI locks itself — it never simulates
success.** Full contract: `lib/server/README.md`.

Stated plainly, because it is a real change: moving the TIN/EIN, the bank
routing and account numbers and the three documents into email removes
at-rest encryption, key rotation, the retention purge and the masked reviewer
read-back. This was the client's explicit requirement. The compensating
controls are a dedicated `ONBOARDING_TO_EMAIL` mailbox with MFA and restricted
membership, TLS required on the recipient domain, and a written procedure to
move the details into payroll and delete the message.

## What remains to configure for production

Copy `.env.example` to `.env.local` (or the host's environment) and set:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin (also the CSRF origin allowlist) — change when the custom domain is attached |
| `RESEND_API_KEY` | Mail delivery. Without it nothing can be submitted at all |
| `MAIL_FROM_EMAIL` | From address on a domain verified with the provider |
| `INQUIRY_TO_EMAIL` | Where quote and dealership inquiries go |
| `ONBOARDING_TO_EMAIL` | Where approved-driver onboarding goes. No fallback by design — it carries a TIN and bank details |
| `ONBOARDING_ACCESS_CODE_HASHES` | SHA-256 hex of the access codes Solidify issues to approved operators |
| `ONBOARDING_SESSION_SECRET` | Signs the onboarding session cookie (≥32 chars) |
| `ONBOARDING_MAX_UPLOAD_BYTES`, `ONBOARDING_MAX_TOTAL_UPLOAD_BYTES` | Optional. Defaults (2 MiB / 3.5 MiB) are sized to the platform's 4.5 MB request cap |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Optional durable rate limiting across serverless instances |

Until delivery is configured, `/api/health` reports the exact reasons — env
var names only, never values — and the forms show honest,
phone-number-first fallbacks.

Deploys are CLI-only (`npx vercel --prod --yes`) until the Vercel GitHub
integration is installed for the team; `.vercelignore` keeps uploads to source.

## QA

`npm run qa [url]` is **headless only** — it never opens a visible browser. It
launches one headless Edge via `playwright-core`, reuses one context and one
page across 8 routes × 4 viewports (1920×1080, 1536×864, 1440×900, 390×844),
and closes everything on the way out. It asserts carrier positioning and
banned claims (including the retired weak copy and any geography comparative),
"not a broker" ≤ 2 site-wide, no reserved frames, no blue-filled buttons,
non-repeating heading patterns, image reuse (max two slots per photograph),
measured focal points, button sizing, unique titles/descriptions/canonicals,
apply-CTA targets, mobile menu focus trapping, keyboard reachability, the
quote form's honest outcome, the onboarding gate and storage hygiene,
reduced-motion behaviour, and console/network cleanliness. Screenshots land in
`qa/` (gitignored) — including mid-states of the pinned sections — for the
visual review that DOM assertions cannot replace.
