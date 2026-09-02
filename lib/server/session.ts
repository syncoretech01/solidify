/**
 * Onboarding session cookie.
 *
 * `solidify_onb` = `${submissionId}.${expiresAtEpochSec}.${hmac}` where the
 * HMAC-SHA256 (base64url) covers `${submissionId}.${expiresAt}` under
 * ONBOARDING_SESSION_SECRET. HttpOnly, SameSite Strict, Secure in
 * production, two hours. The cookie carries no personal data, only the
 * opaque submission id and an expiry; the signature stops anyone minting
 * a session for a submission they did not unlock.
 */

import { getConfig } from "./config";
import { hmacSign, safeEqual } from "./crypto";
import { readCookie, serializeCookie } from "./csrf";

export const SESSION_COOKIE = "solidify_onb";
export const SESSION_MAX_AGE_SEC = 7200;

const ID_RE = /^[A-Za-z0-9_-]{16,64}$/;

export interface Session {
  submissionId: string;
  expiresAt: number;
}

function secret(): string | null {
  return getConfig().sessionSecret;
}

export function sessionCookie(submissionId: string): string {
  const s = secret();
  if (!s) throw new Error("session secret not configured");
  if (!ID_RE.test(submissionId)) throw new Error("refusing to sign a malformed submission id");
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC;
  const body = `${submissionId}.${expiresAt}`;
  const sig = hmacSign(body, s);
  return serializeCookie(SESSION_COOKIE, `${body}.${sig}`, { httpOnly: true, maxAge: SESSION_MAX_AGE_SEC });
}

export function clearSessionCookie(): string {
  return serializeCookie(SESSION_COOKIE, "", { httpOnly: true, maxAge: 0 });
}

export function readSession(req: Request): Session | null {
  const s = secret();
  if (!s) return null;
  const raw = readCookie(req, SESSION_COOKIE);
  if (!raw || raw.length > 256) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [submissionId, expRaw, sig] = parts;
  if (!submissionId || !expRaw || !sig) return null;
  if (!ID_RE.test(submissionId)) return null;
  if (!/^\d{1,12}$/.test(expRaw)) return null;
  const expected = hmacSign(`${submissionId}.${expRaw}`, s);
  if (!safeEqual(expected, sig)) return null;
  const expiresAt = Number(expRaw);
  if (Math.floor(Date.now() / 1000) >= expiresAt) return null;
  return { submissionId, expiresAt };
}
