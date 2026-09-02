# Server security contract

This directory is the whole server side of the Solidify Transport website:
two pipelines with deliberately different postures, and the plumbing they
share. Nothing in here is imported by client components.

| Pipeline | Data | At rest | In mail | Access |
| --- | --- | --- | --- | --- |
| Inquiries (`/api/inquiry`) | Ordinary contact details | Encrypted | Yes, plain text, if Resend is configured | Nobody reads them back through the site |
| Onboarding (`/api/onboarding/*`) | TIN/EIN, bank routing + account, uploads | Encrypted | **Never** | Access-code session to write; admin bearer to read, masked by default |

## What is encrypted

Every object the store holds is an AES-256-GCM envelope:

```json
{ "v": 1, "alg": "aes-256-gcm", "kid": "k1", "iv": "<12 bytes b64>", "tag": "<16 bytes b64>", "data": "<b64>" }
```

A fresh 12-byte IV is drawn per call; the 16-byte GCM tag authenticates the
ciphertext **and** the AAD. The store (`store/fs.ts`, `store/s3.ts`) only ever
sees these envelopes. There is no plaintext path to disk or bucket.

Object layout and AAD (`onboarding.ts`, `app/api/inquiry/route.ts`):

| Key | Contents | AAD |
| --- | --- | --- |
| `onboarding/<id>/created.json.enc` | `{ createdAt }` | `<id>:created` |
| `onboarding/<id>/steps/<step>.json.enc` | `{ step, savedAt, payload }` | `<id>:<step>` |
| `onboarding/<id>/files/<fileId>.bin.enc` | upload bytes | `<id>:<fileId>` |
| `onboarding/<id>/files/<fileId>.meta.enc` | `{ fileId, purpose, originalName, mime, bytes, uploadedAt }` | `<id>:<fileId>:meta` |
| `onboarding/<id>/complete.json.enc` | `{ completedAt, steps }` | `<id>:complete` |
| `inquiries/<yyyy-mm>/<ref>.json.enc` | `{ reference, receivedAt, inquiry }` | `inquiry:<ref>` |

**AAD binding** means an envelope is tied to its name. Copy one submission's
`direct-deposit.json.enc` over another's and it fails authentication instead
of decrypting under the wrong identity. The same goes for renaming a file
blob or a step.

Secrets on the wire (`ein`, `routingNumber`, `accountNumber`, listed in
`SECRET_FIELDS` in `lib/schemas.ts`) are reduced to digits-only strings before
storage. They are never logged, never emailed, never placed in a URL or a
cookie.

## Key id and rotation

`ONBOARDING_ENCRYPTION_KEY` (base64, exactly 32 bytes) is the active key;
`ONBOARDING_KEY_ID` (default `k1`) is stamped into every envelope as `kid`.
Decrypt looks the key up by `kid`: the active key, or one listed in
`ONBOARDING_PREVIOUS_KEYS` (`kid=base64,kid=base64`, decrypt-only). An
unknown `kid` throws `key_mismatch`, which surfaces as a 500 and a logged
error, never as silently-wrong data.

To rotate:

1. Move the current key into `ONBOARDING_PREVIOUS_KEYS` under its id.
2. Generate a new key, set `ONBOARDING_ENCRYPTION_KEY` and a new `ONBOARDING_KEY_ID`.
3. Deploy. New writes use the new key; old records still open.
4. Re-encrypt old records when convenient: for each submission, read every
   object with `getStep`/`getUploadBytes`/... and write it back with
   `putStep`/`putUpload`/... (a small script using `lib/server/onboarding.ts`
   is all it takes; none is shipped yet).
5. Once no envelope carries the old `kid`, drop it from `ONBOARDING_PREVIOUS_KEYS`.

## Where data lives

- **`s3`** — any S3-compatible bucket (`S3_BUCKET`, `S3_REGION`, optional
  `S3_ENDPOINT` for R2/B2/MinIO, credentials). `S3_PREFIX` is a namespace
  inside the bucket applied to every key, so `S3_PREFIX=solidify` gives
  `solidify/onboarding/<id>/...` and `solidify/inquiries/...`. Path-style
  addressing is forced whenever an endpoint is set. Turn on bucket-level
  default encryption and versioning if the provider offers them; the app
  does not depend on either.
- **`fs`** — `ONBOARDING_STORE_DIR` (default `./.data/onboarding`, gitignored).
  Atomic writes: temp file in the same directory, fsync, rename. Directories
  are created `0o700`, files `0o600` (advisory on Windows). Development and
  long-lived Node hosts only.

**`fs` is refused on Vercel.** `config.ts` marks the store unconfigured with
the reason `fs store refused on Vercel: filesystem is ephemeral`, and
`FsStore`'s constructor throws if `VERCEL` is set. A function's disk lives
only as long as that instance; a write there would report success and then
vanish, which is the one failure mode this system is built to avoid.

## Never simulate success

If storage is not configured, `requireConfigured()` answers **503
`backend_not_configured`** before any body is read, with a message stating
that nothing was saved. `getStore()` throws the same code rather than
returning a stub. The health endpoint pings the store, so a wrong bucket or
bad credentials show up as `configured: false` with a reason, not as
somebody's first failed save. Unexpected exceptions become 500
`server_error` with the text "That did not save. Nothing was stored", which
is true: every write happens after every check, and a failed put throws
before a success response is built.

## Upload cap: 4 MB

`ONBOARDING_MAX_UPLOAD_BYTES` defaults to 4,194,304. Vercel serverless
request bodies cap near 4.5 MB, so anything larger would fail at the
platform edge with a generic error before our handler ran. The route checks
`Content-Length` against the cap (plus 64 KB for multipart framing) before
reading the body, then re-checks the actual file size. Bytes are sniffed
(`%PDF`, JPEG `FF D8 FF`, PNG signature) and the declared type must agree, so
a renamed executable declared as a PDF is rejected before it is stored.
Twelve files per submission at most.

## Access and session model

1. An approved operator gets an access code from Solidify.
2. `POST /api/onboarding/access { code }` hashes it (SHA-256) and compares
   against every digest in `ONBOARDING_ACCESS_CODE_HASHES` with a
   constant-time compare and no short-circuit, so a wrong code costs the same
   time as a right one. The codes themselves are never stored anywhere.
3. On a match a submission is created and two cookies are set:
   - `solidify_onb` — HttpOnly, SameSite=Strict, Secure in production, Path=/,
     2 hours. Value `<submissionId>.<expiresAt>.<hmac>` signed with
     `ONBOARDING_SESSION_SECRET`. No personal data; the signature stops anyone
     minting a session for a submission they did not unlock.
   - `solidify_csrf` — readable by JS, SameSite=Strict, same lifetime.
4. Every write carries the session cookie and `x-csrf-token`. The session
   identifies which submission is being written; a cookie for submission A can
   never touch submission B.
5. After `submit`, further step/upload writes answer 409 `already_complete`.
6. `DELETE /api/onboarding/session` clears both cookies.

Guard order in every write chain: **configured → rate limit → origin/CSRF →
session → body**. Nothing is parsed before the cheap refusals.

## CSRF and origin, fail closed

`csrf.ts` checks the `Origin` header on every state-changing request. A
request **without** an Origin is accepted only if the browser vouches with
`Sec-Fetch-Site: same-origin`. A request **with** an Origin must be in the
allowlist — `NEXT_PUBLIC_SITE_URL`'s origin, the Vercel-provided
`VERCEL_URL` / `VERCEL_BRANCH_URL` / `VERCEL_PROJECT_PRODUCTION_URL` hosts,
and in development `http://localhost:<port>` / `http://127.0.0.1:<port>` — or
equal the request's own host over https. Anything else is 403
`origin_rejected`. Then the double-submit token: cookie and header compared
in constant time, 403 `csrf` on mismatch. `SameSite=Strict` on both cookies
is the third layer.

The CSP in `proxy.ts` (`connect-src 'self'`) is what makes this a closed
system from the browser's side: no script on the onboarding page can talk to
any other origin.

## Rate limiting, honestly

Buckets per client IP (first hop of `x-forwarded-for`, which Vercel sets):
access 10, step 40, upload 20, inquiry 8, admin 30, session 60, all per 10
minutes. With `UPSTASH_REDIS_REST_URL/TOKEN` the counter is a fixed window
in Redis shared by every instance. Without it the limiter is in-memory and
**per warm instance**: real, but soft, and reset on cold start. If Upstash
errors mid-request the call falls back to the memory limiter and logs a
warning; it does not fail the request and it does not pretend the shared
limit was applied. Behind no proxy at all, `x-forwarded-for` is
client-controlled and only the shared `unknown` bucket is trustworthy.

## Logging

`log.ts` writes JSON lines to stdout/stderr (not `console.*`, which the
production build strips). A redactor runs over the message and metadata to
depth 8: keys matching
`ssn|tin|ein|tax_id|routing|account_number|acct|iban|swift|dob|card|cvv|password|secret|token|code`
are replaced wholesale; any run of seven or more digits (spaces or dashes
between them allowed) inside a string is replaced; Buffers print as
`[buffer Nb]`. `log.error` records name, message and stack only — never a
request body. Because `code` is on the denylist, error codes go in the
message text, not metadata. The digit rule also eats some ISO dates inside
strings; that is the accepted cost.

## Retention and cron

`ONBOARDING_RETENTION_DAYS` (default 90). `POST|GET /api/onboarding/purge`
deletes submissions whose anchor — `completedAt` if submitted, else
`createdAt` — is older than that. It accepts `Authorization: Bearer
<ONBOARDING_ADMIN_TOKEN>` or `Bearer <CRON_SECRET>`. `vercel.json` schedules
it at 04:00 UTC daily; Vercel invokes crons with GET and its own
`CRON_SECRET` bearer, which is why both verbs are served. A submission whose
records cannot be read is counted as an error and left alone, never deleted
on a guess. Inquiries are not purged automatically (they hold no financial
data); delete them from the bucket by month prefix when desired.

## Reviewer read-back

`GET /api/onboarding/records/:id` with the admin bearer returns decrypted
steps and file metadata with `ein`, `routingNumber`, `accountNumber` shown as
`•••• 1234`. `?reveal=1` returns the full values and writes an audit line
`{"msg":"audit:reveal","meta":{"audit":true,"event":"reveal","submissionId":…,"ip":…}}`.
Plain views, file downloads and deletes are audited the same way.
`GET .../files/:fileId` streams the decrypted upload as an attachment with
the sniffed content type. Unknown or malformed ids are 404, never 500.
`ONBOARDING_ADMIN_TOKEN` unset means nobody can read: 503
`admin_not_configured`. The admin bucket is rate limited before the token
is compared.

## Health

`GET /api/health` → `{ ok, onboarding: { configured, reasons? }, inquiry: {
configured, reasons? } }`. Reasons name environment variables and say what
is wrong with them; they never include a value.

## To configure for production (Vercel)

Required for onboarding:

- `ONBOARDING_ENCRYPTION_KEY` — base64 of 32 random bytes
- `ONBOARDING_KEY_ID` — e.g. `k1`
- `ONBOARDING_STORE=s3` plus `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`,
  `S3_SECRET_ACCESS_KEY`, and `S3_ENDPOINT` for non-AWS providers
  (`S3_PREFIX` optional)
- `ONBOARDING_ACCESS_CODE_HASHES` — comma-separated SHA-256 hex digests
- `ONBOARDING_SESSION_SECRET` — 32+ characters, random
- `ONBOARDING_ADMIN_TOKEN` — 16+ characters, random (reviewer read-back)
- `NEXT_PUBLIC_SITE_URL` — the public https origin (origin allowlist)
- `CRON_SECRET` — Vercel sets it for projects with crons; otherwise set it

Required for inquiries: the store above **or** `RESEND_API_KEY` +
`INQUIRY_TO_EMAIL` (+ `INQUIRY_FROM_EMAIL` on a verified domain).

Recommended: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` so limits
hold across instances. Optional: `ONBOARDING_RETENTION_DAYS`,
`ONBOARDING_MAX_UPLOAD_BYTES`, `ONBOARDING_PREVIOUS_KEYS`.

Verify with `GET /api/health`, then `npm run onboarding:smoke` (see the
header of `scripts/onboarding-smoke.mjs` for the two-phase procedure).

## Known limits

- The memory rate limiter is per instance; use Upstash in production.
- The encryption key lives in Vercel env, the same trust domain as the
  code. An HSM/KMS-wrapped key would be the next step; the `kid` field is
  where that would plug in.
- There is no reviewer UI; read-back is a bearer-token API for `curl` or a
  future internal page. The token is a single shared secret; rotate it by
  changing the env var.
- No re-encryption script ships yet (see "Key id and rotation").
- The step endpoint validates file references at save time; `submit` trusts
  those saved steps and does not re-verify uploads.
- Inquiry email is plain text to a mailbox; that channel's confidentiality
  is the mailbox's. Onboarding never uses it.
- `NEXT_PUBLIC_*` variables are inlined at build time; changing
  `NEXT_PUBLIC_SITE_URL` needs a redeploy.
- The fs driver's permission bits are advisory on Windows.
- Upstash fallback means a burst during a Redis outage is limited per
  instance only, and a warn line is written each time.
