# Solidify Transport

The website of **Solidify Transport LLC**, an auto transport motor carrier moving
vehicles for OEMs, dealerships and consumers across all 48 contiguous states,
with strong Western US coverage.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · GSAP + Lenis ·
Three.js · Zod · react-hook-form · Playwright (headless QA).

```bash
npm install
npm run dev          # http://localhost:3000
npm run images       # AVIF/WebP/JPEG ladder from assets/media (build runs this)
npm run build        # production build
npm start
npm run typecheck
npm run qa           # headless multi-viewport QA (see below) — needs a running server
npm run onboarding:smoke -- http://localhost:3000 --phase unconfigured|configured
```

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Homepage — what / who / why, process, coverage, trust, conversion |
| `/car-shipping` | Consumer + commercial vehicle shipping, quote form, FAQ |
| `/oem-dealerships` | OEM, dealership and dealer-group transport, commercial inquiry |
| `/owner-operators` | Recruiting, requirements, insurance minimums, **two paths** (new application → external portal; approved → secure onboarding on the same page) |
| `/about` | Who Solidify is, coverage, how it operates, company identity |
| `/contact` | Three separated inquiry lanes + contact details |
| `/privacy` | Privacy notice (we collect TIN/EIN and bank data during onboarding) |
| `/api/*` | Inquiry + onboarding pipelines — see `lib/server/README.md` |

## What may be said on this site

Solidify is a **motor carrier that transports vehicles**. Not a broker, not a
marketplace, not a load board, not a general-freight carrier. Copy that implies
Solidify arranges transport rather than performs it is a defect, and the QA
harness fails the build on broker phrasing.

Every company fact lives in `lib/site.ts` and nowhere else. Confirmed:

| Fact | Value |
| --- | --- |
| Legal name | Solidify Transport LLC |
| Address | 2455 Naglee Rd. #314, Tracy, CA 95304 |
| Phone | (510) 499-4552 |
| Coverage | All 48 contiguous states; strongest across the Western states |
| Owner-operator compensation | A percentage of line-haul revenue (**the percentage is not public — never invent it**) |
| Payment terms | Net 30 |
| Insurance minimums | Cargo $500,000 · Auto liability $1,000,000 CSL · GL $1,000,000 each occurrence / $1,000,000 aggregate |
| Certificate holder | Solidify Transport LLC, 2455 Naglee Rd. #314, Tracy, CA 95304 |
| Driver application | `APPLY_URL` (external New Era Titans portal) |

Not supplied, therefore not rendered anywhere (`CLIENT_DATA` nulls): USDOT and
MC numbers, a public email address. Nothing on the site asserts fleet size,
years in business, safety ratings, transit guarantees, tracking, open/enclosed
equipment, on-time figures, testimonials or awards.

## Photography

Masters live in `assets/media/` (committed, never served). `npm run images`
writes the responsive ladder to `public/media/gen/` (gitignored) and a
manifest of **measured** dimensions to `lib/images.json`. Every image reaches
the page through `<Plate slot="…">`, which resolves a slot in `lib/media.ts`;
a slot with no honest photograph renders a designed reserved composition.

`assets/media/CREDITS.txt` records provenance and the vetting evidence for
every frame: no competitor livery, US origin positively established, no
renders. People in frames are stock subjects and are never captioned as
Solidify staff.

## Security posture (short version)

Two pipelines with different postures. Inquiries are encrypted at rest and
optionally emailed. Owner-operator onboarding (TIN/EIN, bank routing/account,
uploads) is behind an access-code session, encrypted at rest with AES-256-GCM
and AAD binding, never emailed, never logged, never stored in the browser,
masked by default on reviewer read-back, and purged on a retention schedule.
**If storage is not configured, every onboarding write returns 503 and the UI
locks itself — it never simulates success.** Full contract: `lib/server/README.md`.

## What remains to configure for production

Copy `.env.example` to `.env.local` (or the host's environment) and set:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin (also the CSRF origin allowlist) |
| `ONBOARDING_ENCRYPTION_KEY`, `ONBOARDING_KEY_ID` | 32-byte base64 key + id |
| `ONBOARDING_STORE=s3` + `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Object storage. **Required on Vercel** — the `fs` driver is refused there because the filesystem is ephemeral. |
| `ONBOARDING_ACCESS_CODE_HASHES` | SHA-256 hex of the access codes Solidify issues to approved operators |
| `ONBOARDING_SESSION_SECRET` | Signs the onboarding session cookie |
| `ONBOARDING_ADMIN_TOKEN` | Bearer token for reviewer read-back; unset means nobody can read records |
| `INQUIRY_TO_EMAIL`, `RESEND_API_KEY`, `INQUIRY_FROM_EMAIL` | Inquiry email delivery (inquiries also persist in the store) |
| `UPSTASH_REDIS_REST_URL/TOKEN` | Optional durable rate limiting across serverless instances |
| `CRON_SECRET` | Vercel Cron auth for the daily retention purge (`vercel.json`) |

Until the store is configured, `/api/health` reports the exact reasons and the
forms show honest, phone-number-first fallbacks.

## QA

`npm run qa [url]` is **headless only** — it never opens a visible browser. It
launches one headless Edge via `playwright-core`, reuses one context and one
page across 7 routes × 4 viewports (1920×1080, 1536×864, 1440×900, 390×844),
and closes everything on the way out. It asserts carrier positioning and
banned claims, image reuse (max two slots per photograph), measured focal
points, button sizing, unique titles/descriptions/canonicals, apply-CTA
targets, mobile menu focus trapping, keyboard reachability, the quote form's
honest outcome, the onboarding gate and storage hygiene, reduced-motion
behaviour, and console/network cleanliness. Screenshots land in `qa/`
(gitignored) for visual review.
