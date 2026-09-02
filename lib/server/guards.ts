/**
 * Route-handler guards. Each returns a NextResponse to send, or null/value
 * to proceed. Order in every write chain:
 *
 *   configured → rate limit → csrf/origin → session → body
 *
 * `fail()` is the single place an exception becomes an HTTP response. It
 * logs message + stack, never a body, and its client-facing messages say
 * plainly whether anything was stored (it was not).
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { fieldErrors } from "@/lib/schemas";
import { getConfig } from "./config";
import { safeEqual } from "./crypto";
import { isAppError } from "./errors";
import { log } from "./log";
import { clientIp, getRateLimiter, LIMITS, type LimitBucket } from "./ratelimit";
import { readSession, type Session } from "./session";

export const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
} as const;

export const MESSAGES = {
  backendNotConfigured:
    "Onboarding is not accepting submissions yet because secure storage is not configured on this server. Nothing you entered has been saved. Please contact Solidify Transport directly.",
  inquiryNotConfigured: "We could not receive your request online right now. Please call (510) 499-4552.",
  serverError: "That did not save. Nothing was stored — please try again.",
  fileTooLarge: "Files must be 4 MB or smaller.",
  adminNotConfigured: "Reviewer access is not configured on this server.",
  rateLimited: "Too many attempts. Please wait a few minutes and try again.",
} as const;

export interface JsonInit {
  status?: number;
  headers?: Record<string, string>;
  cookies?: string[];
}

/** JSON response with no-store headers and optional Set-Cookie lines. */
export function json(body: unknown, init: JsonInit = {}): NextResponse {
  const res = NextResponse.json(body, { status: init.status ?? 200, headers: { ...NO_STORE_HEADERS, ...(init.headers ?? {}) } });
  for (const c of init.cookies ?? []) res.headers.append("Set-Cookie", c);
  return res;
}

export function fail(err: unknown, where: string): NextResponse {
  if (err instanceof ZodError) {
    return json({ error: "validation_failed", fields: fieldErrors(err) }, { status: 422 });
  }
  if (isAppError(err)) {
    switch (err.code) {
      case "validation_failed":
        return json({ error: "validation_failed", fields: err.fields ?? {} }, { status: 422 });
      case "backend_not_configured":
        log.warn(`${where}: refused, backend not configured`);
        return json({ error: "backend_not_configured", message: MESSAGES.backendNotConfigured }, { status: 503 });
      case "inquiry_not_configured":
        log.warn(`${where}: refused, inquiry pipeline not configured`);
        return json({ error: "inquiry_not_configured", message: MESSAGES.inquiryNotConfigured }, { status: 503 });
      case "admin_not_configured":
        return json({ error: "admin_not_configured", message: MESSAGES.adminNotConfigured }, { status: 503 });
      case "payload_too_large":
        return json({ error: "payload_too_large", message: "Request is too large." }, { status: 413 });
      case "file_too_large":
        return json({ error: "file_too_large", message: fileTooLargeMessage() }, { status: 413 });
      case "bad_json":
        return json({ error: "bad_json", message: "Request body must be JSON." }, { status: 400 });
      case "bad_form":
        return json({ error: "bad_form", message: "Request must be multipart form data with a file." }, { status: 400 });
      case "rate_limited":
        return json(
          { error: "rate_limited", message: MESSAGES.rateLimited, retryAfter: err.retryAfterSec ?? 60 },
          { status: 429, headers: { "Retry-After": String(err.retryAfterSec ?? 60) } },
        );
      case "not_found":
        return json({ error: "not_found" }, { status: 404 });
      case "already_complete":
        return json({ error: "already_complete", message: "This application has already been submitted." }, { status: 409 });
      case "incomplete":
        return json({ error: "incomplete", missing: err.missing ?? [] }, { status: 409 });
      case "key_mismatch":
      case "decrypt_failed":
        break; // fall through to 500 with logging
    }
  }
  log.error(`${where}: unhandled error`, err);
  return json({ error: "server_error", message: MESSAGES.serverError }, { status: 500 });
}

/** "Files must be N MB or smaller." from the configured cap. */
export function fileTooLargeMessage(): string {
  const mb = getConfig().maxUploadBytes / (1024 * 1024);
  const shown = Number.isInteger(mb) ? String(mb) : mb.toFixed(1);
  return `Files must be ${shown} MB or smaller.`;
}

/**
 * 503 unless records can be read and written: key + store. Reviewer
 * routes and the purge need this much and no more (no access codes).
 */
export function requireStorage(): NextResponse | null {
  const cfg = getConfig();
  if (cfg.storeConfigured && cfg.encryptionKey) return null;
  log.warn("onboarding: storage request refused, not configured", {
    reasons: [...cfg.storeReasons, ...(cfg.encryptionKey ? [] : ["ONBOARDING_ENCRYPTION_KEY is not usable"])],
  });
  return json({ error: "backend_not_configured", message: MESSAGES.backendNotConfigured }, { status: 503 });
}

/** 503 unless the onboarding pipeline is fully configured. */
export function requireConfigured(): NextResponse | null {
  const cfg = getConfig();
  if (cfg.onboardingConfigured) return null;
  log.warn("onboarding: request refused, not configured", { reasons: cfg.onboardingReasons });
  return json({ error: "backend_not_configured", message: MESSAGES.backendNotConfigured }, { status: 503 });
}

/** 503 unless inquiries can be stored or mailed. */
export function requireInquiryConfigured(): NextResponse | null {
  const cfg = getConfig();
  if (cfg.inquiryConfigured) return null;
  log.warn("inquiry: request refused, not configured", { reasons: cfg.inquiryReasons });
  return json({ error: "inquiry_not_configured", message: MESSAGES.inquiryNotConfigured }, { status: 503 });
}

/** 429 when `key` has exceeded `max` hits in `windowMs`. */
export async function withLimit(req: Request, key: string, max: number, windowMs: number): Promise<NextResponse | null> {
  const ip = clientIp(req);
  const { ok, retryAfterSec } = await getRateLimiter().hit(`${key}:${ip}`, max, windowMs);
  if (ok) return null;
  return json(
    { error: "rate_limited", message: MESSAGES.rateLimited, retryAfter: retryAfterSec },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
  );
}

/** `withLimit` using one of the named buckets in LIMITS. */
export function limit(req: Request, bucket: LimitBucket): Promise<NextResponse | null> {
  const { max, windowMs } = LIMITS[bucket];
  return withLimit(req, bucket, max, windowMs);
}

/** A verified session, or a 401 response. */
export function requireSession(req: Request): Session | NextResponse {
  const session = readSession(req);
  if (session) return session;
  return json({ error: "no_session", message: "Your onboarding session has expired. Enter your access code again." }, { status: 401 });
}

function bearer(req: Request): string | null {
  const h = req.headers.get("authorization");
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m?.[1]?.trim() || null;
}

/**
 * Reviewer access: `Authorization: Bearer <ONBOARDING_ADMIN_TOKEN>`.
 * Rate limited before comparison. 503 when no token is configured.
 */
export async function requireAdmin(req: Request): Promise<NextResponse | null> {
  const limited = await limit(req, "admin");
  if (limited) return limited;
  const cfg = getConfig();
  if (!cfg.adminToken) return json({ error: "admin_not_configured", message: MESSAGES.adminNotConfigured }, { status: 503 });
  const token = bearer(req);
  if (!token || !safeEqual(token, cfg.adminToken)) {
    return json({ error: "unauthorized" }, { status: 401, headers: { "WWW-Authenticate": "Bearer" } });
  }
  return null;
}

/** Purge caller: admin bearer OR the Vercel cron secret. */
export async function requireAdminOrCron(req: Request): Promise<NextResponse | null> {
  const limited = await limit(req, "admin");
  if (limited) return limited;
  const cfg = getConfig();
  const token = bearer(req);
  if (!cfg.adminToken && !cfg.cronSecret) {
    return json({ error: "admin_not_configured", message: MESSAGES.adminNotConfigured }, { status: 503 });
  }
  if (!token) return json({ error: "unauthorized" }, { status: 401, headers: { "WWW-Authenticate": "Bearer" } });
  const adminOk = cfg.adminToken ? safeEqual(token, cfg.adminToken) : false;
  const cronOk = cfg.cronSecret ? safeEqual(token, cfg.cronSecret) : false;
  if (adminOk || cronOk) return null;
  return json({ error: "unauthorized" }, { status: 401, headers: { "WWW-Authenticate": "Bearer" } });
}
