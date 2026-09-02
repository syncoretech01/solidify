/**
 * Server configuration, read from the environment lazily and memoised.
 *
 * Nothing here runs at module import. The first request that needs config
 * pays for one pass over `process.env`; everything after reuses it. This
 * matters on Vercel, where a cold start evaluates every imported module and
 * where env is injected per deployment, never mutated in flight.
 *
 * "Configured" is a hard, honest gate. If it is false, the write endpoints
 * answer 503 and store nothing. There is no degraded mode that pretends.
 */

import path from "node:path";

export type StoreKind = "s3" | "fs";

export interface S3Settings {
  bucket: string;
  region: string;
  endpoint: string | null;
  accessKeyId: string;
  secretAccessKey: string;
  /** Namespace prefix inside the bucket; "" means bucket root. */
  prefix: string;
}

export interface ServerConfig {
  isVercel: boolean;
  isProd: boolean;

  /** Canonical origin from NEXT_PUBLIC_SITE_URL, or null when unset/invalid. */
  siteOrigin: string | null;
  /** Origins a browser request may carry. Empty means every cross-check fails. */
  allowedOrigins: string[];

  encryptionKey: Buffer | null;
  keyId: string;
  /** Older keys, decrypt-only, keyed by key id. See README "Key rotation". */
  previousKeys: ReadonlyMap<string, Buffer>;

  storeKind: StoreKind | null;
  storeConfigured: boolean;
  storeReasons: string[];
  s3: S3Settings | null;
  fsDir: string | null;

  accessCodeHashes: string[];
  sessionSecret: string | null;
  adminToken: string | null;
  cronSecret: string | null;

  retentionDays: number;
  maxUploadBytes: number;

  inquiryToEmail: string | null;
  inquiryFromEmail: string;
  resendApiKey: string | null;
  mailConfigured: boolean;

  upstash: { url: string; token: string } | null;

  onboardingConfigured: boolean;
  onboardingReasons: string[];
  inquiryConfigured: boolean;
  inquiryReasons: string[];
}

const DEFAULT_KEY_ID = "k1";
const DEFAULT_RETENTION_DAYS = 90;
const DEFAULT_MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const DEFAULT_FS_DIR = "./.data/onboarding";
const DEFAULT_FROM = "quotes@solidifytransport.com";
const MIN_SESSION_SECRET_CHARS = 32;
const MIN_ADMIN_TOKEN_CHARS = 16;

let cached: ServerConfig | undefined;

function env(name: string): string | null {
  const v = process.env[name];
  if (v === undefined) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

function intEnv(name: string, fallback: number, reasons: string[]): number {
  const raw = env(name);
  if (raw === null) return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) {
    reasons.push(`${name} must be a positive integer (got a non-integer); using default ${fallback}`);
    return fallback;
  }
  return n;
}

/** Strict-ish base64 decode: must be base64/base64url characters and decode to `bytes`. */
function decodeKey(raw: string, bytes: number): Buffer | null {
  if (!/^[A-Za-z0-9+/=_-]+$/.test(raw)) return null;
  const buf = Buffer.from(raw, "base64");
  return buf.length === bytes ? buf : null;
}

function parseOrigin(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.origin;
  } catch {
    return null;
  }
}

function build(): ServerConfig {
  const isVercel = env("VERCEL") !== null;
  const isProd = process.env.NODE_ENV === "production";

  /* ── origins ─────────────────────────────────────────────────────────── */
  const siteOrigin = parseOrigin(env("NEXT_PUBLIC_SITE_URL"));
  const allowed = new Set<string>();
  if (siteOrigin) allowed.add(siteOrigin);
  // Vercel-provided hosts are platform-set, never attacker-controlled, so
  // preview deployments and the production alias are allowed as well.
  for (const name of ["VERCEL_URL", "VERCEL_BRANCH_URL", "VERCEL_PROJECT_PRODUCTION_URL"]) {
    const host = env(name);
    if (host) {
      const o = parseOrigin(host.startsWith("http") ? host : `https://${host}`);
      if (o) allowed.add(o);
    }
  }
  if (!isProd) {
    const port = env("PORT") ?? "3000";
    for (const p of new Set([port, "3000"])) {
      allowed.add(`http://localhost:${p}`);
      allowed.add(`http://127.0.0.1:${p}`);
    }
  }
  const allowedOrigins = [...allowed];

  /* ── encryption ──────────────────────────────────────────────────────── */
  const keyReasons: string[] = [];
  const rawKey = env("ONBOARDING_ENCRYPTION_KEY");
  let encryptionKey: Buffer | null = null;
  if (rawKey === null) {
    keyReasons.push("ONBOARDING_ENCRYPTION_KEY is not set");
  } else {
    encryptionKey = decodeKey(rawKey, 32);
    if (!encryptionKey) keyReasons.push("ONBOARDING_ENCRYPTION_KEY must be base64 of exactly 32 bytes");
  }
  const keyId = env("ONBOARDING_KEY_ID") ?? DEFAULT_KEY_ID;
  if (!/^[A-Za-z0-9_-]{1,32}$/.test(keyId)) keyReasons.push("ONBOARDING_KEY_ID must be 1-32 characters of [A-Za-z0-9_-]");

  const previousKeys = new Map<string, Buffer>();
  const rawPrev = env("ONBOARDING_PREVIOUS_KEYS");
  if (rawPrev) {
    for (const entry of rawPrev.split(",")) {
      const [kid, b64] = entry.split("=").map((s) => s.trim());
      if (!kid || !b64) {
        keyReasons.push("ONBOARDING_PREVIOUS_KEYS entries must look like kid=base64");
        continue;
      }
      const k = decodeKey(b64, 32);
      if (!k) {
        keyReasons.push(`ONBOARDING_PREVIOUS_KEYS entry "${kid}" is not base64 of exactly 32 bytes`);
        continue;
      }
      previousKeys.set(kid, k);
    }
  }

  /* ── store ───────────────────────────────────────────────────────────── */
  const storeReasons: string[] = [];
  const rawStore = env("ONBOARDING_STORE");
  let storeKind: StoreKind | null = null;
  let s3: S3Settings | null = null;
  let fsDir: string | null = null;

  if (rawStore === null) {
    storeReasons.push("ONBOARDING_STORE is not set (expected s3 or fs)");
  } else if (rawStore === "s3") {
    storeKind = "s3";
    const bucket = env("S3_BUCKET");
    const accessKeyId = env("S3_ACCESS_KEY_ID");
    const secretAccessKey = env("S3_SECRET_ACCESS_KEY");
    const endpoint = env("S3_ENDPOINT");
    const region = env("S3_REGION") ?? (endpoint ? "auto" : "us-east-1");
    if (!bucket) storeReasons.push("S3_BUCKET is not set");
    if (!accessKeyId) storeReasons.push("S3_ACCESS_KEY_ID is not set");
    if (!secretAccessKey) storeReasons.push("S3_SECRET_ACCESS_KEY is not set");
    if (endpoint && !parseOrigin(endpoint)) storeReasons.push("S3_ENDPOINT must be an http(s) URL");
    if (bucket && accessKeyId && secretAccessKey && (!endpoint || parseOrigin(endpoint))) {
      s3 = {
        bucket,
        region,
        endpoint: endpoint ?? null,
        accessKeyId,
        secretAccessKey,
        prefix: (env("S3_PREFIX") ?? "").replace(/^\/+|\/+$/g, ""),
      };
    }
  } else if (rawStore === "fs") {
    storeKind = "fs";
    if (isVercel) {
      storeReasons.push("fs store refused on Vercel: filesystem is ephemeral");
    } else {
      fsDir = path.resolve(/* turbopackIgnore: true */ process.cwd(), env("ONBOARDING_STORE_DIR") ?? DEFAULT_FS_DIR);
    }
  } else {
    storeReasons.push("ONBOARDING_STORE must be s3 or fs");
  }
  const storeConfigured = storeReasons.length === 0 && (s3 !== null || fsDir !== null);

  /* ── access / session / admin ────────────────────────────────────────── */
  const accessReasons: string[] = [];
  const accessCodeHashes: string[] = [];
  const rawHashes = env("ONBOARDING_ACCESS_CODE_HASHES");
  if (rawHashes === null) {
    accessReasons.push("ONBOARDING_ACCESS_CODE_HASHES is not set");
  } else {
    let bad = 0;
    for (const h of rawHashes.split(",")) {
      const t = h.trim().toLowerCase();
      if (t === "") continue;
      if (/^[0-9a-f]{64}$/.test(t)) accessCodeHashes.push(t);
      else bad += 1;
    }
    if (bad > 0) accessReasons.push(`ONBOARDING_ACCESS_CODE_HASHES has ${bad} entr${bad === 1 ? "y" : "ies"} that are not sha256 hex`);
    if (accessCodeHashes.length === 0) accessReasons.push("ONBOARDING_ACCESS_CODE_HASHES contains no valid sha256 hex digest");
  }

  const sessionSecret = env("ONBOARDING_SESSION_SECRET");
  if (sessionSecret === null) accessReasons.push("ONBOARDING_SESSION_SECRET is not set");
  else if (sessionSecret.length < MIN_SESSION_SECRET_CHARS)
    accessReasons.push(`ONBOARDING_SESSION_SECRET must be at least ${MIN_SESSION_SECRET_CHARS} characters`);

  let adminToken = env("ONBOARDING_ADMIN_TOKEN");
  if (adminToken !== null && adminToken.length < MIN_ADMIN_TOKEN_CHARS) adminToken = null;

  const cronSecret = env("CRON_SECRET");

  /* ── limits ──────────────────────────────────────────────────────────── */
  const limitReasons: string[] = [];
  const retentionDays = intEnv("ONBOARDING_RETENTION_DAYS", DEFAULT_RETENTION_DAYS, limitReasons);
  const maxUploadBytes = intEnv("ONBOARDING_MAX_UPLOAD_BYTES", DEFAULT_MAX_UPLOAD_BYTES, limitReasons);

  /* ── mail ────────────────────────────────────────────────────────────── */
  const inquiryToEmail = env("INQUIRY_TO_EMAIL");
  const resendApiKey = env("RESEND_API_KEY");
  const inquiryFromEmail = env("INQUIRY_FROM_EMAIL") ?? DEFAULT_FROM;
  const mailConfigured = inquiryToEmail !== null && resendApiKey !== null;

  /* ── rate limiting ───────────────────────────────────────────────────── */
  const upstashUrl = env("UPSTASH_REDIS_REST_URL");
  const upstashToken = env("UPSTASH_REDIS_REST_TOKEN");
  const upstash = upstashUrl && upstashToken && parseOrigin(upstashUrl) ? { url: upstashUrl.replace(/\/+$/, ""), token: upstashToken } : null;

  /* ── verdicts ────────────────────────────────────────────────────────── */
  const originReasons = allowedOrigins.length === 0 ? ["no allowed origin: set NEXT_PUBLIC_SITE_URL to the public https origin"] : [];

  const onboardingReasons = [
    ...keyReasons,
    ...(sessionSecret !== null && sessionSecret.length >= MIN_SESSION_SECRET_CHARS && accessCodeHashes.length > 0 ? [] : accessReasons),
    ...(storeConfigured ? [] : storeReasons.map((r) => `store: ${r}`)),
    ...originReasons,
    ...limitReasons,
  ];
  const onboardingConfigured =
    encryptionKey !== null &&
    keyReasons.length === 0 &&
    storeConfigured &&
    sessionSecret !== null &&
    sessionSecret.length >= MIN_SESSION_SECRET_CHARS &&
    accessCodeHashes.length > 0 &&
    allowedOrigins.length > 0;

  const inquiryStoreOk = storeConfigured && encryptionKey !== null && keyReasons.length === 0;
  const inquiryConfigured = (inquiryStoreOk || mailConfigured) && allowedOrigins.length > 0;
  const inquiryReasons: string[] = [];
  if (!inquiryConfigured) {
    if (!inquiryStoreOk) {
      inquiryReasons.push(...storeReasons.map((r) => `store: ${r}`), ...keyReasons.map((r) => `store: ${r}`));
    }
    if (!mailConfigured) inquiryReasons.push("mail: RESEND_API_KEY and INQUIRY_TO_EMAIL are not both set");
    inquiryReasons.push(...originReasons);
  }

  return {
    isVercel,
    isProd,
    siteOrigin,
    allowedOrigins,
    encryptionKey,
    keyId,
    previousKeys,
    storeKind,
    storeConfigured,
    storeReasons,
    s3,
    fsDir,
    accessCodeHashes,
    sessionSecret: sessionSecret !== null && sessionSecret.length >= MIN_SESSION_SECRET_CHARS ? sessionSecret : null,
    adminToken,
    cronSecret,
    retentionDays,
    maxUploadBytes,
    inquiryToEmail,
    inquiryFromEmail,
    resendApiKey,
    mailConfigured,
    upstash,
    onboardingConfigured,
    onboardingReasons,
    inquiryConfigured,
    inquiryReasons,
  };
}

/** Memoised. First call reads the environment; later calls are free. */
export function getConfig(): ServerConfig {
  if (!cached) cached = build();
  return cached;
}
