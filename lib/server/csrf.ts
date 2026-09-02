/**
 * Origin check + double-submit CSRF token.
 *
 * Origin fails CLOSED. A request with no Origin header is accepted only if
 * the browser vouches for it with `Sec-Fetch-Site: same-origin`; a request
 * with an Origin must match the allowlist (NEXT_PUBLIC_SITE_URL, the
 * Vercel-provided hosts, dev localhost) or equal the request's own host
 * over https. Anything else is 403.
 *
 * CSRF token: the server sets `solidify_csrf` (readable by JS, SameSite
 * Strict) and returns the same value in JSON. The client echoes it in
 * `x-csrf-token`. The two are compared in constant time.
 */

import { NextResponse } from "next/server";
import { getConfig } from "./config";
import { newId, safeEqual } from "./crypto";

export const CSRF_COOKIE = "solidify_csrf";
export const CSRF_HEADER = "x-csrf-token";
export const CSRF_MAX_AGE_SEC = 7200;

/* ── cookie helpers shared with session.ts ───────────────────────────────── */

export function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const k = part.slice(0, eq).trim();
    if (k !== name) continue;
    const v = part.slice(eq + 1).trim();
    return v === "" ? null : v;
  }
  return null;
}

export interface CookieOptions {
  httpOnly: boolean;
  maxAge: number;
}

export function serializeCookie(name: string, value: string, opts: CookieOptions): string {
  const cfg = getConfig();
  const parts = [`${name}=${value}`, "Path=/", "SameSite=Strict", `Max-Age=${opts.maxAge}`];
  if (opts.httpOnly) parts.push("HttpOnly");
  if (cfg.isProd) parts.push("Secure");
  return parts.join("; ");
}

/* ── csrf ────────────────────────────────────────────────────────────────── */

export function newCsrfToken(): string {
  return newId(24);
}

export function csrfCookie(token: string): string {
  return serializeCookie(CSRF_COOKIE, token, { httpOnly: false, maxAge: CSRF_MAX_AGE_SEC });
}

export function clearCsrfCookie(): string {
  return serializeCookie(CSRF_COOKIE, "", { httpOnly: false, maxAge: 0 });
}

export type OriginVerdict = { ok: true } | { ok: false; reason: string };

export function checkOrigin(req: Request): OriginVerdict {
  const cfg = getConfig();
  const origin = req.headers.get("origin");

  if (origin === null) {
    const site = req.headers.get("sec-fetch-site");
    return site === "same-origin" ? { ok: true } : { ok: false, reason: "missing_origin" };
  }
  if (origin === "null") return { ok: false, reason: "opaque_origin" };

  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return { ok: false, reason: "malformed_origin" };
  }
  if (cfg.allowedOrigins.includes(parsed.origin)) return { ok: true };

  // Same-host fallback: the browser set Origin to the host it is talking
  // to. Only https in production so a plaintext alias cannot sneak in.
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").split(",")[0]?.trim();
  if (host && parsed.host === host && (parsed.protocol === "https:" || !cfg.isProd)) return { ok: true };

  return { ok: false, reason: "origin_not_allowed" };
}

function forbidden(error: string, message: string): NextResponse {
  return NextResponse.json({ error, message }, { status: 403, headers: { "Cache-Control": "no-store" } });
}

/** 403 unless the request's origin is acceptable. Null means proceed. */
export function requireOrigin(req: Request): NextResponse | null {
  const verdict = checkOrigin(req);
  if (verdict.ok) return null;
  return forbidden("origin_rejected", "This request did not come from the Solidify Transport website.");
}

/** Origin check, then double-submit token check. Null means proceed. */
export function requireCsrf(req: Request): NextResponse | null {
  const originFail = requireOrigin(req);
  if (originFail) return originFail;
  const cookie = readCookie(req, CSRF_COOKIE);
  const header = req.headers.get(CSRF_HEADER);
  if (!cookie || !header || cookie.length < 16 || !safeEqual(cookie, header)) {
    return forbidden("csrf", "Your session token is missing or stale. Reload the page and try again.");
  }
  return null;
}
