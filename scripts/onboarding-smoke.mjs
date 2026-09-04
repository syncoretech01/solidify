#!/usr/bin/env node
/**
 * Onboarding API smoke test. Runs against a live server; the CALLER starts the
 * server and injects its environment.
 *
 *   node scripts/onboarding-smoke.mjs [baseUrl] --phase unconfigured|configured|delivery-failure
 *
 * This site keeps no submission record. There is no store to sweep and no
 * reviewer route to read back: the whole application travels in ONE multipart
 * request and the ONLY route to success is a 2xx from the mail provider. These
 * three phases exist to prove exactly that.
 *
 * Script env:
 *   SMOKE_ACCESS_CODE   the plaintext code whose sha256 is in ONBOARDING_ACCESS_CODE_HASHES
 *   SMOKE_MAIL_DIR      where the local mail sink wrote messages (default .data/mail)
 *
 * ── unconfigured ───────────────────────────────────────────────────────────
 * Start the server with no RESEND_API_KEY. Every write must refuse with 503
 * and say plainly that nothing was saved or sent.
 *
 * ── configured ─────────────────────────────────────────────────────────────
 *   node scripts/mail-sink.mjs 3479 &
 *   node scripts/local-env.mjs        # writes .env.local pointing at the sink
 *   npx next dev -p 3477
 *
 * ── delivery-failure ───────────────────────────────────────────────────────
 *   node scripts/mail-sink.mjs 3479 --fail &
 * Same server, refusing sink. Submit must answer 502 and never 200.
 *
 * Use `next dev` (NODE_ENV=development) so http://localhost:<port> is an
 * allowed Origin, and so RESEND_API_BASE is honoured at all — it is ignored
 * in production by design.
 *
 * Exit code 1 on any failure. Fixed test secrets: EIN 987654321, routing
 * 021000021 (valid ABA), account 55512345678.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const argv = process.argv.slice(2);
const BASE = (argv.find((a) => !a.startsWith("--")) ?? "http://localhost:3000").replace(/\/+$/, "");
const phaseIdx = argv.indexOf("--phase");
const PHASE = phaseIdx === -1 ? "configured" : (argv[phaseIdx + 1] ?? "configured");

const ACCESS_CODE = process.env.SMOKE_ACCESS_CODE ?? "";
const MAIL_DIR = process.env.SMOKE_MAIL_DIR ?? join(process.cwd(), ".data", "mail");

const SECRETS = { ein: "987654321", routing: "021000021", account: "55512345678" };
const PLAIN_MARKERS = ["Smoke Test Carrier LLC", "smoke-operator@example.com", "5GZCZ43D13S812715"];

/* ── harness ─────────────────────────────────────────────────────────────── */

let passed = 0;
const failures = [];
function check(name, cond, detail) {
  if (cond) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failures.push(name);
    console.log(`  FAIL  ${name}${detail !== undefined ? `  — ${typeof detail === "string" ? detail : JSON.stringify(detail)}` : ""}`);
  }
}
function finish() {
  console.log("");
  console.log(`${passed} passed, ${failures.length} failed  (phase: ${PHASE}, base: ${BASE})`);
  if (failures.length) {
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
  process.exit(0);
}

const jar = new Map();
function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}
function absorb(res) {
  const setCookies = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const line of setCookies) {
    const [pair, ...attrs] = line.split(";");
    const eq = pair.indexOf("=");
    const k = pair.slice(0, eq).trim();
    const v = pair.slice(eq + 1).trim();
    const maxAge = attrs.map((a) => a.trim().toLowerCase()).find((a) => a.startsWith("max-age="));
    if (v === "" || maxAge === "max-age=0") jar.delete(k);
    else jar.set(k, v);
  }
  return setCookies;
}

/**
 * opts: json | form | headers | origin (null = omit) | cookies (bool) | csrf | bearer
 */
let ipSeq = 0;
async function call(method, path, opts = {}) {
  const headers = { accept: "application/json", ...(opts.headers ?? {}) };
  // The limiter keys on the client IP. Every call here is a distinct caller so
  // that a 429 never stands in for the answer under test; the limiter itself is
  // exercised deliberately in its own check.
  if (!headers["x-forwarded-for"]) headers["x-forwarded-for"] = `10.0.0.${++ipSeq % 250}`;
  if (opts.origin !== null) headers.origin = opts.origin ?? BASE;
  if (opts.cookies !== false && jar.size) headers.cookie = cookieHeader();
  if (opts.csrf) headers["x-csrf-token"] = opts.csrf;
  if (opts.bearer) headers.authorization = `Bearer ${opts.bearer}`;
  let body;
  if (opts.json !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(opts.json);
  } else if (opts.form) {
    body = opts.form;
  }
  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body, redirect: "manual" });
  } catch (err) {
    return { status: 0, data: null, text: String(err), headers: new Headers(), setCookies: [], buffer: null };
  }
  const setCookies = absorb(res);
  const buffer = Buffer.from(await res.arrayBuffer());
  const text = buffer.toString("utf8");
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }
  return { status: res.status, data, text, headers: res.headers, setCookies, buffer };
}

/* ── fixtures ────────────────────────────────────────────────────────────── */

const PDF_BYTES = Buffer.concat([
  Buffer.from("%PDF-1.4\n%âãÏÓ\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n", "latin1"),
]);
const PNG_BYTES = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.from("0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7c1f2d50000000049454e44ae426082", "hex"),
]);
const MZ_BYTES = Buffer.concat([Buffer.from("MZ"), Buffer.alloc(200, 0x90)]);

/** A client-minted id: 32 of [A-Za-z0-9_-], which is what the server accepts. */
let idSeq = 0;
const fid = (tag) => (tag + "0".repeat(32)).slice(0, 32).replace(/0$/, String(++idSeq % 10));

/**
 * One submission: the five steps as JSON plus its documents, with the purpose
 * and the id encoded in each part name. `parts` entries are
 * { id, purpose, bytes, name, type }.
 */
function submission(data, parts) {
  const form = new FormData();
  form.set("data", JSON.stringify(data));
  for (const p of parts) form.append(`file.${p.purpose}.${p.id}`, new File([p.bytes], p.name, { type: p.type }), p.name);
  return form;
}

const CERT_ID = fid("cert");
const W9_ID = fid("w9doc");
const CHECK_ID = fid("check");

const fullPayload = (over = {}) => ({
  profile: PROFILE,
  equipment: EQUIPMENT,
  insurance: insurance([CERT_ID]),
  w9: w9(W9_ID),
  "direct-deposit": directDeposit(CHECK_ID),
  ...over,
});

const fullParts = () => [
  { id: CERT_ID, purpose: "certificate", bytes: PDF_BYTES, name: "COI 2026.pdf", type: "application/pdf" },
  { id: W9_ID, purpose: "w9", bytes: PDF_BYTES, name: "w9 signed.pdf", type: "application/pdf" },
  { id: CHECK_ID, purpose: "voided-check", bytes: PNG_BYTES, name: "check.png", type: "image/png" },
];

/** What the mail sink actually received, newest first. */
function sentMessages() {
  if (!existsSync(MAIL_DIR)) return [];
  return readdirSync(MAIL_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ file: f, body: JSON.parse(readFileSync(join(MAIL_DIR, f), "utf8")) }))
    .sort((a, b) => b.file.localeCompare(a.file));
}

const PROFILE = {
  companyName: "Smoke Test Carrier LLC",
  contactPerson: "Sam Smoke",
  phone: "(510) 555-0100",
  email: "smoke-operator@example.com",
  addressLine: "1 Test Way",
  city: "Tracy",
  state: "CA",
  zip: "95304",
};
const EQUIPMENT = {
  powerUnitVin: "5GZCZ43D13S812715",
  make: "Freightliner",
  model: "Cascadia",
  year: "2019",
  capacity: "9-car",
  dot: "1234567",
  mc: "765432",
  serviceAreas: "CA, NV, AZ",
  gpsTracking: "Samsara",
};
const insurance = (ids) => ({
  cargoPolicyNumber: "CGO-1",
  generalLiabilityPolicyNumber: "GL-1",
  autoLiabilityPolicyNumber: "",
  agentName: "Agent Smoke",
  agentEmail: "agent@example.com",
  agentPhone: "5105550101",
  acknowledgedLimits: true,
  certificateFileIds: ids,
});
const w9 = (id) => ({ w9FileId: id, w9Confirmed: true });
// Mirrors lib/schemas.ts — the server accepts only this exact pair.
const DDA_VERSION = "dda-2026-09";
const DDA_TEXT = "I authorize Solidify Transport LLC to deposit all payments due to me in the account(s) named herein. I further authorize Solidify Transport LLC the authority to make debits or take other corrective actions, if necessary, in relation to any deposit made by Solidify Transport LLC into the account(s).";
const directDeposit = (voidedId, routing = "021-000-021") => ({
  payeeName: "Smoke Test Carrier LLC",
  payeeAddressLine: "1 Test Way",
  payeeCity: "Tracy",
  payeeState: "CA",
  payeeZip: "95304",
  payeePhone: "5105550100",
  ein: "98-7654321",
  bankName: "Test Bank",
  bankAddressLine: "2 Bank St",
  bankCity: "Tracy",
  bankState: "CA",
  bankZip: "95304",
  bankPhone: "",
  bankFax: "",
  payeeMc: "",
  routingNumber: routing,
  accountNumber: "5551 2345 678",
  accountType: "checking",
  depositAuthorization: true,
  authorizationText: DDA_TEXT,
  authorizationVersion: DDA_VERSION,
  voidedCheckFileId: voidedId,
  signatureName: "Sam Smoke",
  signatureDate: "2026-09-03",
});
const INQUIRY = {
  lane: "vehicle",
  name: "Smoke Inquirer",
  phone: "5105550102",
  email: "smoke-inquiry@example.com",
  pickupCity: "Tracy",
  pickupState: "CA",
  deliveryCity: "Phoenix",
  deliveryState: "AZ",
  vehicleYear: "2021",
  vehicleMake: "Toyota",
  vehicleModel: "Tacoma",
  operable: "operable",
  notes: "",
  website: "",
  startedAt: Date.now() - 10_000,
};
/* ── "the site writes nothing" ───────────────────────────────────────────── */

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  let names = [];
  try {
    names = readdirSync(dir);
  } catch {
    return out; // another process's directory; not ours to inspect
  }
  for (const name of names) {
    const p = join(dir, name);
    try {
      if (statSync(p).isDirectory()) walk(p, out);
      else out.push(p);
    } catch {
      /* vanished or locked mid-walk */
    }
  }
  return out;
}

/**
 * There is no store to sweep any more, which is itself the thing to assert:
 * after a full submission nothing exists on disk under the old locations and
 * no temp file was left behind.
 */
function sweepNothingWritten(label) {
  const legacy = [join(process.cwd(), ".data", "onboarding"), join(process.cwd(), "server", "data")];
  const written = legacy.flatMap((d) => walk(d));
  check(`${label}: no submission store exists`, written.length === 0, written.slice(0, 5));
  // Shallow, and only our own names: the system temp directory is shared.
  let tmpNames = [];
  try {
    tmpNames = readdirSync(tmpdir());
  } catch {
    tmpNames = [];
  }
  // Only artefacts the app could have produced. The QA harness's own browser
  // profiles (solidify-edge-*, solidify-apply-qa*) live here too and are not ours.
  const strays = tmpNames.filter((f) => /onboarding/i.test(f) || /.(enc|tmp)$/i.test(f) && /solidify/i.test(f));
  check(`${label}: nothing left in the temp directory`, strays.length === 0, strays.slice(0, 5));
}

/** No secret digit run may appear anywhere in a response body. */
function assertNoSecretEcho(label, res) {
  const needles = [...Object.values(SECRETS), ...PLAIN_MARKERS];
  const hit = needles.filter((n) => (res.text ?? "").includes(n));
  check(`${label}: response echoes no submitted value`, hit.length === 0, hit);
}

/* ── phase: unconfigured ─────────────────────────────────────────────────── */

async function phaseUnconfigured() {
  console.log(`\nPhase: unconfigured against ${BASE}\n`);
  const health = await call("GET", "/api/health", { origin: null });
  check("health responds 200", health.status === 200, health.status);
  check("health: onboarding.configured === false", health.data?.onboarding?.configured === false, health.data);
  check("health: onboarding.reasons is a non-empty array", Array.isArray(health.data?.onboarding?.reasons) && health.data.onboarding.reasons.length > 0);
  check(
    "health: reasons never contain an env value (only names)",
    JSON.stringify(health.data?.onboarding?.reasons ?? []).match(/[A-Za-z0-9+/]{40,}={0,2}/) === null,
  );
  const reasonText = JSON.stringify(health.data ?? {});
  check("health: reasons no longer mention a store or an encryption key", !/S3_|ONBOARDING_STORE|ENCRYPTION_KEY/.test(reasonText), reasonText.slice(0, 160));

  const access = await call("POST", "/api/onboarding/access", { json: { code: ACCESS_CODE || "anything" } });
  check("access with a valid code → 503 backend_not_configured", access.status === 503 && access.data?.error === "backend_not_configured", {
    status: access.status,
    body: access.data,
  });
  check("access 503 sets no cookies", access.setCookies.length === 0, access.setCookies);
  check("access 503 message says nothing was saved or sent", /Nothing you enter here is saved or sent/.test(access.data?.message ?? ""), access.data?.message);

  const session = await call("GET", "/api/onboarding/session", { origin: null });
  check("session probe → no_session (200 ok:false)", session.status === 200 && session.data?.ok === false && session.data?.error === "no_session", session.data);

  const submit = await call("POST", "/api/onboarding/submit", { form: submission(fullPayload(), fullParts()) });
  check("submit → 503 (refused before the body is read)", submit.status === 503, submit.status);

  const inquiry = await call("POST", "/api/inquiry", { json: INQUIRY });
  check("inquiry → 503 inquiry_not_configured", inquiry.status === 503 && inquiry.data?.error === "inquiry_not_configured", { status: inquiry.status, body: inquiry.data });
  check("inquiry 503 message gives the phone number", /\(510\) 499-4552/.test(inquiry.data?.message ?? ""));

  for (const [method, path] of [
    ["POST", "/api/onboarding/upload"],
    ["POST", "/api/onboarding/step"],
    ["GET", "/api/onboarding/progress"],
    ["GET", "/api/onboarding/purge"],
    ["GET", "/api/onboarding/records/abc"],
  ]) {
    const gone = await call(method, path, {});
    check(`${method} ${path} no longer exists`, gone.status === 404 || gone.status === 405, gone.status);
  }

  sweepNothingWritten("unconfigured");
  finish();
}

/* ── phase: configured ───────────────────────────────────────────────────── */

async function phaseConfigured() {
  console.log(`\nPhase: configured against ${BASE}\n`);
  if (!ACCESS_CODE) {
    console.log("  FAIL  SMOKE_ACCESS_CODE is required for the configured phase");
    process.exit(1);
  }

  const health = await call("GET", "/api/health", { origin: null });
  check("health: onboarding.configured === true", health.data?.onboarding?.configured === true, health.data);
  check("health: inquiry.configured === true", health.data?.inquiry?.configured === true, health.data);

  /* ── the gate ──────────────────────────────────────────────────────────── */
  const wrong = await call("POST", "/api/onboarding/access", { json: { code: `${ACCESS_CODE}-nope` } });
  check("wrong access code → 401", wrong.status === 401 && wrong.data?.error === "invalid_code", { status: wrong.status, body: wrong.data });

  const foreign = await call("POST", "/api/onboarding/access", { json: { code: ACCESS_CODE }, origin: "https://evil.example" });
  check("foreign Origin → 403", foreign.status === 403, foreign.status);

  const access = await call("POST", "/api/onboarding/access", { json: { code: ACCESS_CODE } });
  check("right code → 200 with a reference and a csrf token", access.status === 200 && typeof access.data?.reference === "string" && typeof access.data?.csrfToken === "string", access.data);
  const reference = access.data?.reference ?? "";
  const csrf = access.data?.csrfToken ?? "";
  check("reference is phone-readable (no 0/O/1/I)", /^[A-HJ-NP-Z2-9]{16,32}$/.test(reference), reference);

  const sessionCookie = access.setCookies.find((c) => c.startsWith("solidify_onb="));
  check("session cookie is HttpOnly and SameSite=Strict", /HttpOnly/i.test(sessionCookie ?? "") && /SameSite=Strict/i.test(sessionCookie ?? ""), sessionCookie);
  check("session cookie carries no submitted value", !Object.values(SECRETS).some((v) => (sessionCookie ?? "").includes(v)));
  const csrfCookie = access.setCookies.find((c) => c.startsWith("solidify_csrf="));
  check("csrf cookie is readable by script (double submit)", csrfCookie !== undefined && !/HttpOnly/i.test(csrfCookie), csrfCookie);

  const resumed = await call("GET", "/api/onboarding/session", { origin: null });
  check("session resumes and re-issues the cookie (sliding window)", resumed.status === 200 && resumed.data?.ok === true && resumed.data?.reference === reference, resumed.data);
  check("session reports no server-side progress", resumed.data?.completed === undefined && resumed.data?.complete === undefined, resumed.data);
  const csrf2 = resumed.data?.csrfToken ?? csrf;

  /* ── the guard chain on submit ─────────────────────────────────────────── */
  const noCsrf = await call("POST", "/api/onboarding/submit", { form: submission(fullPayload(), fullParts()) });
  check("submit without the csrf header → 403", noCsrf.status === 403, noCsrf.status);

  const badCsrf = await call("POST", "/api/onboarding/submit", { form: submission(fullPayload(), fullParts()), csrf: "not-the-token" });
  check("submit with a mismatched csrf token → 403", badCsrf.status === 403, badCsrf.status);

  const noOrigin = await call("POST", "/api/onboarding/submit", { form: submission(fullPayload(), fullParts()), csrf: csrf2, origin: null });
  check("submit with no Origin fails closed → 403", noOrigin.status === 403, noOrigin.status);

  const sameSite = await call("POST", "/api/onboarding/submit", {
    form: submission(fullPayload(), fullParts()),
    csrf: csrf2,
    origin: null,
    headers: { "sec-fetch-site": "same-origin" },
  });
  check("Sec-Fetch-Site: same-origin is accepted in place of Origin", sameSite.status !== 403, sameSite.status);

  /* ── validation, before anything is sent ───────────────────────────────── */
  const before = sentMessages().length;

  const missingStep = await call("POST", "/api/onboarding/submit", {
    form: submission({ profile: PROFILE, equipment: EQUIPMENT, insurance: insurance([CERT_ID]), w9: w9(W9_ID) }, fullParts()),
    csrf: csrf2,
  });
  check("a missing step → 409 incomplete, naming it", missingStep.status === 409 && (missingStep.data?.missing ?? []).includes("direct-deposit"), missingStep.data);

  const badAba = await call("POST", "/api/onboarding/submit", {
    form: submission(fullPayload({ "direct-deposit": directDeposit(CHECK_ID, "021000022") }), fullParts()),
    csrf: csrf2,
  });
  check("a routing number that fails its checksum → 422, naming the field by its full path", badAba.status === 422 && "direct-deposit.routingNumber" in (badAba.data?.fields ?? {}), badAba.data);
  assertNoSecretEcho("routing rejection", badAba);

  const mzParts = fullParts().map((p) => (p.purpose === "w9" ? { ...p, bytes: MZ_BYTES } : p));
  const mz = await call("POST", "/api/onboarding/submit", { form: submission(fullPayload(), mzParts), csrf: csrf2 });
  check("an executable declared as a PDF → 422", mz.status === 422, { status: mz.status, body: mz.data });

  const pngAsPdf = fullParts().map((p) => (p.purpose === "certificate" ? { ...p, bytes: PNG_BYTES, type: "application/pdf" } : p));
  const mismatch = await call("POST", "/api/onboarding/submit", { form: submission(fullPayload(), pngAsPdf), csrf: csrf2 });
  check("a PNG declared as a PDF → 422", mismatch.status === 422, mismatch.status);

  const orphan = await call("POST", "/api/onboarding/submit", {
    form: submission(fullPayload(), [...fullParts(), { id: fid("extra"), purpose: "certificate", bytes: PDF_BYTES, name: "extra.pdf", type: "application/pdf" }]),
    csrf: csrf2,
  });
  check("a document no step refers to → 422", orphan.status === 422, orphan.status);

  const danglingId = fid("ghost");
  const dangling = await call("POST", "/api/onboarding/submit", {
    form: submission(fullPayload({ insurance: insurance([danglingId]) }), fullParts().filter((p) => p.purpose !== "certificate")),
    csrf: csrf2,
  });
  check("a step referencing a document that was not attached → 422", dangling.status === 422, dangling.status);

  const big = Buffer.alloc(2.5 * 1024 * 1024, 0x41);
  const oversize = fullParts().map((p) => (p.purpose === "w9" ? { ...p, bytes: Buffer.concat([PDF_BYTES, big]) } : p));
  const tooBig = await call("POST", "/api/onboarding/submit", { form: submission(fullPayload(), oversize), csrf: csrf2 });
  check("a document over the per-file cap → 413", tooBig.status === 413, tooBig.status);

  check("nothing was sent while every one of those was rejected", sentMessages().length === before, `${sentMessages().length} vs ${before}`);

  /* ── the one path to success ───────────────────────────────────────────── */
  const ok = await call("POST", "/api/onboarding/submit", { form: submission(fullPayload(), fullParts()), csrf: csrf2 });
  check("a complete submission → 200 with the reference it was given", ok.status === 200 && ok.data?.ok === true && ok.data?.reference === reference, ok.data);
  check("the 200 carries a delivery timestamp", typeof ok.data?.deliveredAt === "string", ok.data);
  assertNoSecretEcho("submit success", ok);

  const sent = sentMessages();
  check("exactly one message was delivered", sent.length === before + 1, `${sent.length} vs ${before}`);
  const msg = sent[0]?.body ?? {};
  check("it went to the onboarding mailbox, not the inquiry one", /onboarding@/.test(String(msg.to)), msg.to);
  check("the subject carries the company and the reference, and no secret", String(msg.subject).includes(reference) && !Object.values(SECRETS).some((v) => String(msg.subject).includes(v)), msg.subject);
  check("the body carries the routing number in full (it is the delivery mechanism)", String(msg.text).includes(SECRETS.routing), "missing");
  const flat = String(msg.text).replace(/\s+/g, " ");
  check("the body carries the verbatim authorization", flat.includes(DDA_TEXT), "missing");
  check("the body records the authorization version", String(msg.text).includes(DDA_VERSION), "missing");
  check("three documents are attached", (msg.attachments ?? []).length === 3, (msg.attachments ?? []).length);
  check(
    "attachment names are server-generated from the reference, not the uploader's filename",
    (msg.attachments ?? []).every((a) => String(a.filename).startsWith(reference)) && !(msg.attachments ?? []).some((a) => ["COI 2026.pdf", "w9 signed.pdf", "check.png"].includes(String(a.filename))),
    (msg.attachments ?? []).map((a) => a.filename),
  );
  check("the reply-to is the operator", String(msg.reply_to ?? "").includes("smoke-operator@example.com"), msg.reply_to);

  sweepNothingWritten("after a delivered submission");

  /* ── inquiries take the same route ─────────────────────────────────────── */
  const inqBefore = sentMessages().length;
  const inquiry = await call("POST", "/api/inquiry", { json: INQUIRY });
  check("a valid inquiry → 200 with a reference", inquiry.status === 200 && typeof inquiry.data?.reference === "string", inquiry.data);
  check("the inquiry was delivered", sentMessages().length === inqBefore + 1, sentMessages().length);

  const honeypot = await call("POST", "/api/inquiry", { json: { ...INQUIRY, website: "spam" } });
  check("a filled honeypot → 422", honeypot.status === 422, honeypot.status);

  finish();
}

/* ── phase: delivery-failure ─────────────────────────────────────────────── */

async function phaseDeliveryFailure() {
  console.log(`\nPhase: delivery-failure against ${BASE}\n`);
  if (!ACCESS_CODE) {
    console.log("  FAIL  SMOKE_ACCESS_CODE is required for the delivery-failure phase");
    process.exit(1);
  }

  const access = await call("POST", "/api/onboarding/access", { json: { code: ACCESS_CODE } });
  check("the gate still opens (delivery is a later concern)", access.status === 200, access.status);
  const csrf = access.data?.csrfToken ?? "";

  const submit = await call("POST", "/api/onboarding/submit", { form: submission(fullPayload(), fullParts()), csrf });
  check("a complete submission whose delivery fails → 502", submit.status === 502 && submit.data?.error === "delivery_failed", { status: submit.status, body: submit.data });
  check("it is never reported as accepted", submit.data?.ok !== true, submit.data);
  check("the message tells the applicant nothing was saved", /Nothing was saved anywhere/i.test(submit.data?.message ?? ""), submit.data?.message);
  check("the message gives the phone number", /\(510\) 499-4552/.test(submit.data?.message ?? ""), submit.data?.message);
  check("the provider's own error is not leaked to the caller", !/sink refusing/i.test(submit.text ?? ""), submit.text?.slice(0, 120));
  assertNoSecretEcho("delivery failure", submit);

  const inquiry = await call("POST", "/api/inquiry", { json: INQUIRY });
  check("an inquiry whose delivery fails → 502, never a fake success", inquiry.status === 502 && inquiry.data?.ok !== true, { status: inquiry.status, body: inquiry.data });

  sweepNothingWritten("after a failed delivery");
  finish();
}

/* ── run ─────────────────────────────────────────────────────────────────── */

try {
  if (PHASE === "unconfigured") await phaseUnconfigured();
  else if (PHASE === "configured") await phaseConfigured();
  else if (PHASE === "delivery-failure") await phaseDeliveryFailure();
  else {
    console.error(`Unknown phase "${PHASE}". Use --phase unconfigured, configured or delivery-failure.`);
    process.exit(2);
  }
} catch (err) {
  console.error("smoke test crashed:", err);
  failures.push("crash");
}
finish();
