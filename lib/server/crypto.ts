/**
 * AES-256-GCM envelopes, ids, and constant-time helpers.
 *
 * Every record at rest is `{ v, alg, kid, iv, tag, data }`. The AAD passed
 * to encrypt/decrypt binds a ciphertext to its identity (submission id,
 * step, file id), so a blob copied from one submission into another fails
 * authentication instead of decrypting under the wrong name.
 *
 * `kid` records which key produced a ciphertext. Decrypt looks the key up
 * by id (active key or one listed in ONBOARDING_PREVIOUS_KEYS) and throws
 * `key_mismatch` when it has no key for that id.
 */

import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getConfig } from "./config";
import { AppError } from "./errors";

export const ENVELOPE_VERSION = 1 as const;
export const ENVELOPE_ALG = "aes-256-gcm" as const;
const IV_BYTES = 12;
const TAG_BYTES = 16;

export interface Envelope {
  v: typeof ENVELOPE_VERSION;
  alg: typeof ENVELOPE_ALG;
  kid: string;
  iv: string;
  tag: string;
  data: string;
}

function activeKey(): { key: Buffer; kid: string } {
  const cfg = getConfig();
  if (!cfg.encryptionKey) throw new AppError("backend_not_configured", "Encryption key is not configured.");
  return { key: cfg.encryptionKey, kid: cfg.keyId };
}

function keyFor(kid: string): Buffer | null {
  const cfg = getConfig();
  if (cfg.encryptionKey && kid === cfg.keyId) return cfg.encryptionKey;
  return cfg.previousKeys.get(kid) ?? null;
}

export function encrypt(plaintext: Buffer | string, aad: string): Envelope {
  const { key, kid } = activeKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(aad, "utf8"));
  const input = typeof plaintext === "string" ? Buffer.from(plaintext, "utf8") : plaintext;
  const data = Buffer.concat([cipher.update(input), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    v: ENVELOPE_VERSION,
    alg: ENVELOPE_ALG,
    kid,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: data.toString("base64"),
  };
}

export function isEnvelope(x: unknown): x is Envelope {
  if (!x || typeof x !== "object") return false;
  const e = x as Record<string, unknown>;
  return (
    e.v === ENVELOPE_VERSION &&
    e.alg === ENVELOPE_ALG &&
    typeof e.kid === "string" &&
    typeof e.iv === "string" &&
    typeof e.tag === "string" &&
    typeof e.data === "string"
  );
}

export function decrypt(envelope: unknown, aad: string): Buffer {
  if (!isEnvelope(envelope)) throw new AppError("decrypt_failed", "Record is not a recognised envelope.");
  const iv = Buffer.from(envelope.iv, "base64");
  const tag = Buffer.from(envelope.tag, "base64");
  const data = Buffer.from(envelope.data, "base64");
  if (iv.length !== IV_BYTES) throw new AppError("decrypt_failed", "Envelope IV has the wrong length.");
  if (tag.length !== TAG_BYTES) throw new AppError("decrypt_failed", "Envelope tag has the wrong length.");
  const key = keyFor(envelope.kid);
  if (!key) throw new AppError("key_mismatch", "No key is available for the key id on this record.");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAAD(Buffer.from(aad, "utf8"));
  decipher.setAuthTag(tag);
  try {
    return Buffer.concat([decipher.update(data), decipher.final()]);
  } catch {
    throw new AppError("decrypt_failed", "Authentication failed: wrong key, wrong AAD, or altered data.");
  }
}

/** JSON value → encrypted envelope bytes, ready for the object store. */
export function sealJson(value: unknown, aad: string): Buffer {
  return Buffer.from(JSON.stringify(encrypt(JSON.stringify(value), aad)), "utf8");
}

/** Encrypted envelope bytes from the object store → JSON value. */
export function openJson<T>(bytes: Buffer, aad: string): T {
  let parsed: unknown;
  try {
    parsed = JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new AppError("decrypt_failed", "Stored record is not a JSON envelope.");
  }
  return JSON.parse(decrypt(parsed, aad).toString("utf8")) as T;
}

/** Raw bytes → encrypted envelope bytes. */
export function sealBytes(bytes: Buffer, aad: string): Buffer {
  return Buffer.from(JSON.stringify(encrypt(bytes, aad)), "utf8");
}

export function openBytes(bytes: Buffer, aad: string): Buffer {
  let parsed: unknown;
  try {
    parsed = JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new AppError("decrypt_failed", "Stored blob is not a JSON envelope.");
  }
  return decrypt(parsed, aad);
}

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
