# `lib/server` — the pipelines behind the forms

Two things reach Solidify from this website: **inquiries** (vehicle quote, OEM
and dealership) and **approved-driver onboarding** (business details, equipment
and licensing, insurance certificates, a signed W-9, and a direct-deposit
authorization with a TIN and bank account numbers).

**Neither is stored here.** There is no database, no object store, and no
encryption-at-rest key, because there is nothing at rest. Both pipelines
validate, run their security checks, and then deliver by email. The email is
the record.

This is a deliberate reversal of the earlier design, which held onboarding in an
AES-256-GCM envelope in an S3 bucket and carried a standing rule that a TIN
must never sit in a mailbox. The client requires that the website keep no
submission record. Do not "restore" the old rule without restoring the store
with it — on its own it would leave approved-driver submissions with nowhere
to go.

## The shape of a submission

The onboarding wizard is six steps and three documents, all held in **browser
memory** until the applicant presses submit. Nothing exists server-side before
that moment, because there is nowhere to put it.

```
POST /api/onboarding/submit        multipart/form-data
  data                             JSON of all five persisted steps
  file.<purpose>.<id>              0–5 documents; purpose and id in the part name
```

Encoding the purpose and the id in the part name means there is no separate
manifest to keep consistent: the two cannot disagree.

### The order is the guarantee

```
 1  configured?                    → 503   body never read
 2  rate limit (submit: 5/10 min)  → 429
 3  origin + double-submit CSRF    → 403
 4  session cookie                 → 401
 5  Content-Length > 4 MiB         → 413   body never read
 6  parse multipart                → 400
 7  JSON parse + all five steps    → 400 / 409
 8  full zod re-validation         → 422   fields keyed "direct-deposit.routingNumber"
 9  per part: name, count, size,
    running total, magic bytes     → 413 / 422
10  refs ⇄ parts, BOTH directions  → 422   an unreferenced document is rejected too
11  build the email                        pure, no I/O
12  await mailer.send(…)           ←       the only gate
13  a throw here                   → 502   delivery_failed
14  resolved                       → 200   { ok, reference, deliveredAt }
```

Steps 1–10 all run before step 12, so **a rejected submission never generates an
email**, and there is no branch that reaches 200 without a resolved send. The
smoke suite asserts both, including that nothing was sent while a batch of
deliberately invalid submissions was refused.

**No automatic retry, on any error class.** A timeout can mean "delivered, reply
lost"; an automatic retry would silently duplicate a TIN and a bank account into
the mailbox. The applicant retries deliberately instead — and because the
drafts and blobs never left the page, a retry costs them nothing.

The **reference** is minted at `/access` and carried in the session, so a retry
quotes the same reference rather than looking like a second application.

## Byte budgets

Vercel caps a function's request body at **4.5 MB**, and one submission carries
every document. Everything below is derived from that single number:

| Constant | Value | Why |
| --- | --- | --- |
| `MAX_REQUEST_BYTES` | 4 MiB | We produce the 413, not the platform |
| `maxTotalUploadBytes` | 3.5 MiB | Leaves ~64 KiB of headroom for the JSON part and multipart framing |
| `maxUploadBytes` | 2 MiB | A 4 MiB per-file cap would be a lie inside a 3.5 MiB total |
| `MAX_FILES_PER_SUBMISSION` | 5 | Three certificates, a W-9, a voided check |

Images are downscaled in the browser first (`lib/image-downscale.ts`): 2200px on
the long edge — about 200 dpi for a letter page, so a MICR line and a TIN box
stay legible — re-encoded as JPEG until under 1 MiB, with a 1400px floor. PDFs
pass through untouched. All three budgets are enforced at attach time, again at
review time, and again on the server.

## Modules

| File | What it is |
| --- | --- |
| `config.ts` | One lazy, memoised pass over `process.env`. "Configured" is a hard gate with human reasons that name env vars, never values |
| `guards.ts` | The guard chain, the `AppError` → HTTP funnel, `NO_STORE_HEADERS`, and every user-facing message |
| `csrf.ts` | Origin check that fails closed; double-submit token compared in constant time |
| `session.ts` | `solidify_onb = <reference>.<expiry>.<hmac>` — HttpOnly, SameSite=Strict, Secure in production, 2 hours, sliding |
| `crypto.ts` | Identity and signing only: random ids, constant-time compare, SHA-256, HMAC |
| `validate.ts` | Magic-byte sniffing. The declared type must agree with the sniffed one |
| `ratelimit.ts` | Memory (per warm instance) or Upstash. Upstash errors fall back to memory with a warning, never fail open silently |
| `log.ts` | JSON lines with an unconditional redactor in front: a key deny-list plus any run of ≥7 digits |
| `mail.ts` | Resend REST via `fetch`, with attachments. Throws on any non-2xx — which is what makes "success only after delivery" true |
| `onboarding-mail.ts` | The submission rendered as one plain-text email. Pure, so it can be reviewed by eye against the client's forms |
| `onboarding.ts` | What survived the record layer: purposes, caps, id and filename hygiene, secret normalisation |
| `errors.ts` | The coded errors every layer throws |

## Secrets

`SECRET_FIELDS` (`ein`, `routingNumber`, `accountNumber`) travel and are
delivered as digits only. They appear **in full in the email body** — that is
the delivery mechanism the client asked for — and nowhere else: never in a
subject line, never in a filename, never in a log. Nothing returned by
`onboarding-mail.ts` is ever passed to `log.*`; the submit route logs only the
reference, counts and the provider's message id.

On screen they are masked (`SecretInput`), always `type="text"` so the numeric
keyboard survives and credential managers stay out, and the review step shows
last-four only.

## Uploads

PDF, JPEG and PNG only, by magic bytes, with the declared MIME required to
agree — a renamed executable is refused before it is read as anything. The
**attachment filename is generated by the server** from the reference and the
sniffed type, so no byte of the uploader's own filename reaches a mail client's
Save-As dialog; the original name appears in the message body only, cleaned.

## What is lost, plainly

Moving the TIN, the bank credentials and the documents into email removes:

- at-rest encryption and key rotation,
- the scheduled retention purge (the site can no longer delete a submission),
- the masked-by-default reviewer read-back and its audit log,
- and it makes the mail provider's availability the availability of the whole
  pipeline.

Minimum compensating controls to require of the client: a dedicated
`ONBOARDING_TO_EMAIL` mailbox with MFA and restricted membership, TLS required
on the recipient domain, and a written procedure to move the details into the
payroll system and delete the message.

## Environment

See `.env.example`. The short version: `RESEND_API_KEY`, `MAIL_FROM_EMAIL`,
`INQUIRY_TO_EMAIL`, `ONBOARDING_TO_EMAIL`, `ONBOARDING_ACCESS_CODE_HASHES`,
`ONBOARDING_SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`; optionally Upstash and the
two byte caps. `RESEND_API_BASE` points the mailer at a local sink and is
**ignored in production** by design.

## Testing

```
node scripts/mail-sink.mjs 3479            # a provider stand-in that answers 200
node scripts/mail-sink.mjs 3479 --fail     # …and one that answers 502
npm run onboarding:smoke -- <url> --phase unconfigured|configured|delivery-failure
```

The three phases prove, in order: that an unconfigured server refuses instead of
pretending; that a complete submission is validated, delivered once, and echoes
nothing back; and that a refused delivery is reported as a failure and never as
a success.
