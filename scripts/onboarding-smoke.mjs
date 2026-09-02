#!/usr/bin/env node
/**
 * Onboarding API smoke test. Runs against a live server; the CALLER starts
 * the server and injects its environment. Two phases, two server runs.
 *
 *   node scripts/onboarding-smoke.mjs [baseUrl] --phase unconfigured|configured
 *   baseUrl defaults to http://localhost:3000
 *
 * Script env (all optional except where noted per phase):
 *   SMOKE_ACCESS_CODE   the plaintext code whose sha256 is in ONBOARDING_ACCESS_CODE_HASHES  (both phases)
 *   SMOKE_ADMIN_TOKEN   must equal the server's ONBOARDING_ADMIN_TOKEN                        (configured)
 *   SMOKE_STORE_DIR     the server's ONBOARDING_STORE_DIR, for the on-disk plaintext sweep   (both phases)
 *   SMOKE_CRON_SECRET   the server's CRON_SECRET, to exercise the purge route                (optional)
 *
 * ── Phase 1: unconfigured ──────────────────────────────────────────────────
 * Proves the backend refuses instead of pretending. Start the server with an
 * EMPTY key; everything else may be set:
 *
 *   ONBOARDING_ENCRYPTION_KEY= ONBOARDING_STORE=fs ONBOARDING_STORE_DIR=/tmp/onb-smoke \
 *   ONBOARDING_ACCESS_CODE_HASHES=<sha256hex(code)> ONBOARDING_SESSION_SECRET=<32+ chars> \
 *     npx next dev
 *
 *   SMOKE_ACCESS_CODE=<code> SMOKE_STORE_DIR=/tmp/onb-smoke \
 *     node scripts/onboarding-smoke.mjs http://localhost:3000 --phase unconfigured
 *
 * ── Phase 2: configured ────────────────────────────────────────────────────
 *   ONBOARDING_ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))") \
 *   ONBOARDING_KEY_ID=k1 ONBOARDING_STORE=fs ONBOARDING_STORE_DIR=/tmp/onb-smoke \
 *   ONBOARDING_ACCESS_CODE_HASHES=<sha256hex(code)> ONBOARDING_SESSION_SECRET=<32+ chars> \
 *   ONBOARDING_ADMIN_TOKEN=<16+ chars> \
 *     npx next dev
 *
 *   SMOKE_ACCESS_CODE=<code> SMOKE_ADMIN_TOKEN=<token> SMOKE_STORE_DIR=/tmp/onb-smoke \
 *     node scripts/onboarding-smoke.mjs http://localhost:3000 --phase configured
 *
 * Use `next dev` (NODE_ENV=development) so http://localhost:3000 is an
 * allowed Origin. With `next start`, NEXT_PUBLIC_SITE_URL must equal the
 * server URL. On Windows PowerShell set the variables with $env:NAME="..."
 * before each command, or put the server variables in .env.local.
 *
 * Exit code 1 on any failure. Fixed test secrets: EIN 987654321, routing
 * 021000021 (valid ABA), account 55512345678.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const argv = process.argv.slice(2);
const BASE = (argv.find((a) => !a.startsWith("--")) ?? "http://localhost:3000").replace(/\/+$/, "");
const phaseIdx = argv.indexOf("--phase");
const PHASE = phaseIdx === -1 ? "configured" : (argv[phaseIdx + 1] ?? "configured");

const ACCESS_CODE = process.env.SMOKE_ACCESS_CODE ?? "";
const ADMIN_TOKEN = process.env.SMOKE_ADMIN_TOKEN ?? "";
const STORE_DIR = process.env.SMOKE_STORE_DIR ?? process.env.ONBOARDING_STORE_DIR ?? "";
const CRON_SECRET = process.env.SMOKE_CRON_SECRET ?? "";

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
async function call(method, path, opts = {}) {
  const headers = { accept: "application/json", ...(opts.headers ?? {}) };
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

function multipart(purpose, bytes, name, type) {
  const form = new FormData();
  if (purpose !== undefined) form.set("purpose", purpose);
  form.set("file", new File([bytes], name, { type }), name);
  return form;
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
  bankContact: "",
  bankPhone: "",
  routingNumber: routing,
  accountNumber: "5551 2345 678",
  accountType: "checking",
  depositAuthorization: true,
  voidedCheckFileId: voidedId,
  signatureName: "Sam Smoke",
  signatureDate: "2026-09-03",
});
const INQUIRY = {
  lane: "operator",
  name: "Smoke Inquirer",
  phone: "5105550102",
  email: "smoke-inquiry@example.com",
  homeBase: "Tracy, CA",
  equipment: "",
  notes: "",
  website: "",
  startedAt: Date.now() - 10_000,
};

/* ── disk sweep ──────────────────────────────────────────────────────────── */

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function sweepStore(label) {
  if (!STORE_DIR) {
    console.log(`  SKIP  ${label}: SMOKE_STORE_DIR not set`);
    return;
  }
  const files = walk(STORE_DIR);
  const tmp = files.filter((f) => f.endsWith(".tmp"));
  check(`${label}: no .tmp files left behind`, tmp.length === 0, tmp);
  const needles = [...Object.values(SECRETS), ...PLAIN_MARKERS];
  const leaks = [];
  for (const f of files) {
    const text = readFileSync(f).toString("latin1");
    for (const n of needles) if (text.includes(n)) leaks.push(`${f} contains ${n.slice(0, 4)}…`);
  }
  check(`${label}: no plaintext secrets or fields in ${files.length} stored object(s)`, leaks.length === 0, leaks);
  return files;
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

  const access = await call("POST", "/api/onboarding/access", { json: { code: ACCESS_CODE || "anything" } });
  check("access with a valid code → 503 backend_not_configured", access.status === 503 && access.data?.error === "backend_not_configured", {
    status: access.status,
    body: access.data,
  });
  check("access 503 sets no cookies", access.setCookies.length === 0, access.setCookies);
  check("access 503 message says nothing was saved", /Nothing you entered has been saved/.test(access.data?.message ?? ""));

  const session = await call("GET", "/api/onboarding/session", { origin: null });
  check("session → 401 no_session", session.status === 401 && session.data?.error === "no_session", session.data);

  const step = await call("POST", "/api/onboarding/step", { json: { step: "profile", data: PROFILE } });
  check("step → 503 (refused before anything else)", step.status === 503, step.status);

  const upload = await call("POST", "/api/onboarding/upload", { form: multipart("certificate", PDF_BYTES, "c.pdf", "application/pdf") });
  check("upload → 503", upload.status === 503, upload.status);

  if (health.data?.inquiry?.configured === false) {
    const inq = await call("POST", "/api/inquiry", { json: INQUIRY });
    check("inquiry → 503 inquiry_not_configured", inq.status === 503 && inq.data?.error === "inquiry_not_configured", inq.data);
    check("inquiry 503 message gives the phone number", /\(510\) 499-4552/.test(inq.data?.message ?? ""));
  } else {
    console.log("  SKIP  inquiry 503 check: inquiry pipeline is configured on this server");
  }

  if (STORE_DIR) {
    const files = walk(STORE_DIR);
    check("nothing written to the store directory", files.length === 0, files);
  } else {
    console.log("  SKIP  store directory sweep: SMOKE_STORE_DIR not set");
  }
}

/* ── phase: configured ───────────────────────────────────────────────────── */

async function phaseConfigured() {
  console.log(`\nPhase: configured against ${BASE}\n`);
  if (!ACCESS_CODE) console.log("  WARN  SMOKE_ACCESS_CODE not set; access checks will fail");
  if (!ADMIN_TOKEN) console.log("  WARN  SMOKE_ADMIN_TOKEN not set; reviewer checks will fail");

  const health = await call("GET", "/api/health", { origin: null });
  check("health: onboarding.configured === true", health.data?.onboarding?.configured === true, health.data);

  /* access */
  const wrong = await call("POST", "/api/onboarding/access", { json: { code: "definitely-not-the-code" } });
  check("access with wrong code → 401 invalid_code", wrong.status === 401 && wrong.data?.error === "invalid_code", wrong.data);
  check("wrong code sets no cookies", wrong.setCookies.length === 0);

  const foreignAccess = await call("POST", "/api/onboarding/access", { json: { code: ACCESS_CODE }, origin: "https://evil.example" });
  check("access from foreign Origin → 403", foreignAccess.status === 403, foreignAccess.status);

  const access = await call("POST", "/api/onboarding/access", { json: { code: ACCESS_CODE } });
  check("access with right code → 200", access.status === 200 && access.data?.ok === true, access.data);
  const submissionId = access.data?.submissionId;
  let csrf = access.data?.csrfToken;
  check("access returns a well-formed submissionId", typeof submissionId === "string" && /^[A-Za-z0-9_-]{16,64}$/.test(submissionId));
  check("access returns a csrfToken", typeof csrf === "string" && csrf.length >= 16);
  const onb = access.setCookies.find((c) => c.startsWith("solidify_onb="));
  const csrfCookie = access.setCookies.find((c) => c.startsWith("solidify_csrf="));
  check("session cookie set, HttpOnly, SameSite=Strict", !!onb && /httponly/i.test(onb) && /samesite=strict/i.test(onb), onb);
  check("csrf cookie set, NOT HttpOnly, SameSite=Strict", !!csrfCookie && !/httponly/i.test(csrfCookie) && /samesite=strict/i.test(csrfCookie), csrfCookie);
  check("csrf cookie value equals csrfToken", !!csrfCookie && csrfCookie.split(";")[0].split("=")[1] === csrf);
  check("session cookie carries no plaintext secrets", !!onb && !Object.values(SECRETS).some((s) => onb.includes(s)));

  /* session */
  const sess = await call("GET", "/api/onboarding/session", { origin: null });
  check("session → 200 with empty completed[]", sess.status === 200 && Array.isArray(sess.data?.completed) && sess.data.completed.length === 0, sess.data);
  check("session reports complete:false", sess.data?.complete === false);
  check("session refreshes csrfToken", typeof sess.data?.csrfToken === "string" && sess.data.csrfToken !== csrf);
  csrf = sess.data?.csrfToken ?? csrf;

  /* csrf / origin */
  const noCsrf = await call("POST", "/api/onboarding/step", { json: { step: "profile", data: PROFILE } });
  check("step without csrf header → 403", noCsrf.status === 403 && noCsrf.data?.error === "csrf", noCsrf.data);
  const badCsrf = await call("POST", "/api/onboarding/step", { json: { step: "profile", data: PROFILE }, csrf: "x".repeat(32) });
  check("step with mismatched csrf → 403", badCsrf.status === 403, badCsrf.status);
  const foreign = await call("POST", "/api/onboarding/step", { json: { step: "profile", data: PROFILE }, csrf, origin: "https://evil.example" });
  check("step from foreign Origin → 403 origin_rejected", foreign.status === 403 && foreign.data?.error === "origin_rejected", foreign.data);
  const noOrigin = await call("POST", "/api/onboarding/step", { json: { step: "profile", data: PROFILE }, csrf, origin: null });
  check("step with no Origin and no Sec-Fetch-Site → 403 (fail closed)", noOrigin.status === 403, noOrigin.status);
  const sfs = await call("POST", "/api/onboarding/step", {
    json: { step: "profile", data: PROFILE },
    csrf,
    origin: null,
    headers: { "sec-fetch-site": "same-origin" },
  });
  check("step with no Origin but Sec-Fetch-Site: same-origin → accepted", sfs.status === 200, { status: sfs.status, body: sfs.data });

  /* validation without echo */
  const bad = await call("POST", "/api/onboarding/step", {
    json: { step: "profile", data: { ...PROFILE, email: "not-an-email-XYZZY", zip: "ABCDE-QUUX" } },
    csrf,
  });
  check("invalid profile → 422 validation_failed", bad.status === 422 && bad.data?.error === "validation_failed", bad.data);
  check("422 names the email field", typeof bad.data?.fields?.email === "string", bad.data?.fields);
  check("422 names the zip field", typeof bad.data?.fields?.zip === "string", bad.data?.fields);
  check("422 does not echo the submitted values", !bad.text.includes("XYZZY") && !bad.text.includes("QUUX"));
  const badStep = await call("POST", "/api/onboarding/step", { json: { step: "nonsense", data: {} }, csrf });
  check("unknown step → 422", badStep.status === 422, badStep.status);

  /* steps 1-2 */
  const p = await call("POST", "/api/onboarding/step", { json: { step: "profile", data: PROFILE }, csrf });
  check("profile saves", p.status === 200 && p.data?.saved === true && p.data?.step === "profile", p.data);
  const e = await call("POST", "/api/onboarding/step", { json: { step: "equipment", data: EQUIPMENT }, csrf });
  check("equipment saves", e.status === 200 && e.data?.saved === true, e.data);

  /* uploads */
  const mz = await call("POST", "/api/onboarding/upload", { form: multipart("certificate", MZ_BYTES, "cert.pdf", "application/pdf"), csrf });
  check("MZ blob declared as PDF → 422 fields.file", mz.status === 422 && typeof mz.data?.fields?.file === "string", mz.data);
  const mismatch = await call("POST", "/api/onboarding/upload", { form: multipart("certificate", PDF_BYTES, "cert.png", "image/png"), csrf });
  check("PDF bytes declared as PNG → 422", mismatch.status === 422, mismatch.data);
  const badPurpose = await call("POST", "/api/onboarding/upload", { form: multipart("passport", PDF_BYTES, "x.pdf", "application/pdf"), csrf });
  check("unknown purpose → 422 fields.purpose", badPurpose.status === 422 && typeof badPurpose.data?.fields?.purpose === "string", badPurpose.data);
  const noCsrfUpload = await call("POST", "/api/onboarding/upload", { form: multipart("certificate", PDF_BYTES, "c.pdf", "application/pdf") });
  check("upload without csrf → 403", noCsrfUpload.status === 403, noCsrfUpload.status);

  const big = Buffer.concat([PDF_BYTES, Buffer.alloc(4.5 * 1024 * 1024, 0x20)]);
  const tooBig = await call("POST", "/api/onboarding/upload", { form: multipart("certificate", big, "big.pdf", "application/pdf"), csrf });
  check("4.5 MB PDF → 413 file_too_large", tooBig.status === 413 && tooBig.data?.error === "file_too_large", { status: tooBig.status, body: tooBig.data });

  const cert = await call("POST", "/api/onboarding/upload", { form: multipart("certificate", PDF_BYTES, "COI 2026.pdf", "application/pdf"), csrf });
  check("certificate PDF uploads", cert.status === 200 && typeof cert.data?.fileId === "string", cert.data);
  check("upload echoes purpose/bytes/name", cert.data?.purpose === "certificate" && cert.data?.bytes === PDF_BYTES.length && cert.data?.name === "COI 2026.pdf", cert.data);
  const w9f = await call("POST", "/api/onboarding/upload", { form: multipart("w9", PDF_BYTES, "w9.pdf", "application/pdf"), csrf });
  check("W-9 PDF uploads", w9f.status === 200 && typeof w9f.data?.fileId === "string", w9f.data);
  const chk = await call("POST", "/api/onboarding/upload", { form: multipart("voided-check", PNG_BYTES, "check.png", "image/png"), csrf });
  check("voided check PNG uploads", chk.status === 200 && typeof chk.data?.fileId === "string", chk.data);

  /* steps 3-5 with file references */
  const bogusRef = await call("POST", "/api/onboarding/step", { json: { step: "insurance", data: insurance(["AAAAAAAAAAAAAAAAAAAAAAAA"]) }, csrf });
  check("insurance with unknown fileId → 422 fields.certificateFileIds", bogusRef.status === 422 && !!bogusRef.data?.fields?.certificateFileIds, bogusRef.data);
  const wrongPurposeRef = await call("POST", "/api/onboarding/step", { json: { step: "insurance", data: insurance([w9f.data?.fileId]) }, csrf });
  check("insurance referencing the W-9 upload → 422 (wrong purpose)", wrongPurposeRef.status === 422, wrongPurposeRef.data);
  const ins = await call("POST", "/api/onboarding/step", { json: { step: "insurance", data: insurance([cert.data?.fileId]) }, csrf });
  check("insurance saves", ins.status === 200 && ins.data?.saved === true, ins.data);
  const w9s = await call("POST", "/api/onboarding/step", { json: { step: "w9", data: w9(w9f.data?.fileId) }, csrf });
  check("w9 saves", w9s.status === 200 && w9s.data?.saved === true, w9s.data);

  const early = await call("POST", "/api/onboarding/submit", { json: {}, csrf });
  check("submit before direct-deposit → 409 incomplete listing the step", early.status === 409 && early.data?.error === "incomplete" && early.data?.missing?.includes("direct-deposit"), early.data);

  const badAba = await call("POST", "/api/onboarding/step", { json: { step: "direct-deposit", data: directDeposit(chk.data?.fileId, "021000022") }, csrf });
  check("ABA-invalid routing → 422 fields.routingNumber", badAba.status === 422 && typeof badAba.data?.fields?.routingNumber === "string", badAba.data);
  check("ABA 422 does not echo the routing number", !badAba.text.includes("021000022"));
  const dd = await call("POST", "/api/onboarding/step", { json: { step: "direct-deposit", data: directDeposit(chk.data?.fileId) }, csrf });
  check("direct-deposit saves", dd.status === 200 && dd.data?.saved === true, dd.data);
  check("direct-deposit response echoes no secrets", !Object.values(SECRETS).some((s) => dd.text.includes(s)));

  const prog = await call("GET", "/api/onboarding/progress", { origin: null });
  check("progress lists all five steps", prog.status === 200 && Array.isArray(prog.data?.completed) && prog.data.completed.length === 5, prog.data);

  /* submit */
  const sub = await call("POST", "/api/onboarding/submit", { json: {}, csrf });
  check("submit → 200 complete:true", sub.status === 200 && sub.data?.complete === true && sub.data?.submissionId === submissionId, sub.data);
  const after = await call("POST", "/api/onboarding/step", { json: { step: "profile", data: PROFILE }, csrf });
  check("step after completion → 409 already_complete", after.status === 409 && after.data?.error === "already_complete", after.data);
  const sess2 = await call("GET", "/api/onboarding/session", { origin: null });
  check("session reports complete:true", sess2.data?.complete === true, sess2.data);

  /* reviewer read-back */
  const rec = (path, extra = {}) => call("GET", path, { origin: null, cookies: false, ...extra });
  const noAuth = await rec(`/api/onboarding/records/${submissionId}`);
  check("records without auth → 401", noAuth.status === 401, noAuth.status);
  const badAuth = await rec(`/api/onboarding/records/${submissionId}`, { bearer: "nope-nope-nope-nope" });
  check("records with wrong token → 401", badAuth.status === 401, badAuth.status);

  const masked = await rec(`/api/onboarding/records/${submissionId}`, { bearer: ADMIN_TOKEN });
  check("records with token → 200", masked.status === 200 && masked.data?.ok === true, { status: masked.status, body: masked.data });
  check("records masked by default", masked.data?.masked === true);
  const mdd = masked.data?.steps?.["direct-deposit"]?.payload ?? {};
  check("masked routing shows last4 only", mdd.routingNumber === "•••• 0021", mdd.routingNumber);
  check("masked account shows last4 only", mdd.accountNumber === "•••• 5678", mdd.accountNumber);
  check("masked EIN shows last4 only", mdd.ein === "•••• 4321", mdd.ein);
  check("masked response contains no full secret", !Object.values(SECRETS).some((s) => masked.text.includes(s)));
  check("records list the three uploads with metadata", Array.isArray(masked.data?.files) && masked.data.files.length === 3 && masked.data.files.every((f) => f.fileId && f.purpose && f.bytes > 0));
  check("records report complete with completedAt", masked.data?.complete === true && typeof masked.data?.completedAt === "string");

  const full = await rec(`/api/onboarding/records/${submissionId}?reveal=1`, { bearer: ADMIN_TOKEN });
  const fdd = full.data?.steps?.["direct-deposit"]?.payload ?? {};
  check("reveal=1 → masked:false", full.status === 200 && full.data?.masked === false, full.data?.masked);
  check("reveal returns full routing equal to input digits", fdd.routingNumber === SECRETS.routing, fdd.routingNumber);
  check("reveal returns full account equal to input digits", fdd.accountNumber === SECRETS.account, fdd.accountNumber);
  check("reveal returns full EIN equal to input digits", fdd.ein === SECRETS.ein, fdd.ein);
  check("reveal round-trips profile fields", full.data?.steps?.profile?.payload?.companyName === PROFILE.companyName);

  const unknown = await rec(`/api/onboarding/records/AAAAAAAAAAAAAAAAAAAAAAAA`, { bearer: ADMIN_TOKEN });
  check("records unknown id → 404", unknown.status === 404, unknown.status);
  const malformed = await rec(`/api/onboarding/records/..%2F..%2Fetc`, { bearer: ADMIN_TOKEN });
  check("records malformed id → 404 (not 500)", malformed.status === 404, malformed.status);

  const dl = await rec(`/api/onboarding/records/${submissionId}/files/${cert.data?.fileId}`, { bearer: ADMIN_TOKEN });
  check("file download → 200 with PDF content-type", dl.status === 200 && (dl.headers.get("content-type") ?? "").startsWith("application/pdf"), dl.headers.get("content-type"));
  check("file download is an attachment", /^attachment/.test(dl.headers.get("content-disposition") ?? ""), dl.headers.get("content-disposition"));
  check("file download bytes round-trip", dl.buffer && dl.buffer.equals(PDF_BYTES));
  const dlNoAuth = await rec(`/api/onboarding/records/${submissionId}/files/${cert.data?.fileId}`);
  check("file download without auth → 401", dlNoAuth.status === 401, dlNoAuth.status);

  /* disk */
  const files = sweepStore("store sweep");
  if (files) {
    const mine = files.filter((f) => f.includes(submissionId));
    check("store holds objects for this submission (created + 5 steps + 3×2 files + complete = 13)", mine.length === 13, mine.length);
  }

  /* purge (optional) */
  if (CRON_SECRET) {
    const purge = await call("GET", "/api/onboarding/purge", { origin: null, cookies: false, bearer: CRON_SECRET });
    check("purge with CRON_SECRET → 200 and keeps the fresh submission", purge.status === 200 && purge.data?.ok === true && purge.data?.deleted === 0, purge.data);
  } else {
    console.log("  SKIP  purge: SMOKE_CRON_SECRET not set");
  }
  const purgeNoAuth = await call("POST", "/api/onboarding/purge", { origin: null, cookies: false, json: {} });
  check("purge without auth → 401 or 503", purgeNoAuth.status === 401 || purgeNoAuth.status === 503, purgeNoAuth.status);

  /* delete */
  const del = await call("DELETE", `/api/onboarding/records/${submissionId}`, { origin: null, cookies: false, bearer: ADMIN_TOKEN });
  check("admin DELETE → 200 with object count", del.status === 200 && del.data?.deleted === 13, del.data);
  const gone = await rec(`/api/onboarding/records/${submissionId}`, { bearer: ADMIN_TOKEN });
  check("records after delete → 404", gone.status === 404, gone.status);
  if (STORE_DIR) {
    const left = walk(STORE_DIR).filter((f) => f.includes(submissionId));
    check("no objects remain on disk after delete", left.length === 0, left);
  }

  /* inquiry (only when configured) */
  if (health.data?.inquiry?.configured === true) {
    const inq = await call("POST", "/api/inquiry", { json: INQUIRY, cookies: false });
    check("inquiry → 200 with reference", inq.status === 200 && typeof inq.data?.reference === "string" && inq.data.reference.length >= 8, inq.data);
    const fast = await call("POST", "/api/inquiry", { json: { ...INQUIRY, startedAt: Date.now() }, cookies: false });
    check("inquiry filled too fast → 422", fast.status === 422 && !!fast.data?.fields?.startedAt, fast.data);
    const honey = await call("POST", "/api/inquiry", { json: { ...INQUIRY, website: "http://spam" }, cookies: false });
    check("inquiry with honeypot → 422", honey.status === 422, honey.data);
    const foreignInq = await call("POST", "/api/inquiry", { json: INQUIRY, cookies: false, origin: "https://evil.example" });
    check("inquiry from foreign Origin → 403", foreignInq.status === 403, foreignInq.status);
    if (STORE_DIR) {
      const stored = walk(join(STORE_DIR, "inquiries"));
      const leak = stored.some((f) => readFileSync(f).toString("latin1").includes("smoke-inquiry@example.com"));
      check("inquiry stored encrypted (email not in plaintext on disk)", stored.length > 0 && !leak, { stored: stored.length, leak });
    }
  } else {
    console.log("  SKIP  inquiry checks: inquiry pipeline not configured");
  }

  /* end session */
  const end = await call("DELETE", "/api/onboarding/session", {});
  check("session DELETE → 200", end.status === 200 && end.data?.ok === true, end.data);
  check("session DELETE clears both cookies", !jar.has("solidify_onb") && !jar.has("solidify_csrf"), [...jar.keys()]);
  const afterEnd = await call("GET", "/api/onboarding/session", { origin: null });
  check("session after DELETE → 401", afterEnd.status === 401, afterEnd.status);
}

/* ── main ────────────────────────────────────────────────────────────────── */

try {
  const probe = await fetch(`${BASE}/api/health`).catch(() => null);
  if (!probe) {
    console.error(`Cannot reach ${BASE}. Start the server first (see header of this file).`);
    process.exit(2);
  }
  if (PHASE === "unconfigured") await phaseUnconfigured();
  else if (PHASE === "configured") await phaseConfigured();
  else {
    console.error(`Unknown phase "${PHASE}". Use --phase unconfigured or --phase configured.`);
    process.exit(2);
  }
} catch (err) {
  console.error("smoke test crashed:", err);
  failures.push("crash");
}
finish();
