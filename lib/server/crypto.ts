/**
 * Identity and signing.
 *
 * There is no encryption-at-rest layer any more — this site stores nothing.
 * What remains is what the session cookie, the CSRF token and the access-code
 * check need: random ids, a constant-time compare, a hash and an HMAC.
 */

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/** Random id, base64url. 18 bytes → 24 characters. */
export function newId(bytes = 18): string {
  return randomBytes(bytes).toString("base64url");
}

const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

/** Human-readable reference (read over the phone): 10 chars, 50 bits. */
export function newReference(length = 10): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) out += REFERENCE_ALPHABET[bytes[i]! % REFERENCE_ALPHABET.length];
  return out;
}

/** Constant-time equality. A length mismatch still burns a comparison. */
export function safeEqual(a: string | Buffer, b: string | Buffer): boolean {
  const ba = typeof a === "string" ? Buffer.from(a, "utf8") : a;
  const bb = typeof b === "string" ? Buffer.from(b, "utf8") : b;
  if (ba.length !== bb.length) {
    timingSafeEqual(ba, ba);
    return false;
  }
  return timingSafeEqual(ba, bb);
}

export function sha256Hex(s: string | Buffer): string {
  return createHash("sha256").update(s).digest("hex");
}

/** HMAC-SHA256, base64url. */
export function hmacSign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data, "utf8").digest("base64url");
}

export function hmacVerify(data: string, signature: string, secret: string): boolean {
  return safeEqual(hmacSign(data, secret), signature);
}
