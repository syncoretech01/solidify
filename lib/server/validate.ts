/**
 * Request-body and upload validation that zod does not cover: byte
 * budgets and content sniffing.
 */

import { AppError } from "./errors";

const MAGIC = {
  pdf: { bytes: [0x25, 0x50, 0x44, 0x46], mimes: ["application/pdf"], label: "PDF" },
  jpeg: { bytes: [0xff, 0xd8, 0xff], mimes: ["image/jpeg", "image/jpg", "image/pjpeg"], label: "JPEG" },
  png: { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], mimes: ["image/png"], label: "PNG" },
} as const;

export const ACCEPTED_UPLOAD_MIMES = ["application/pdf", "image/jpeg", "image/png"] as const;

function startsWith(buf: Buffer, bytes: readonly number[]): boolean {
  if (buf.length < bytes.length) return false;
  for (let i = 0; i < bytes.length; i += 1) if (buf[i] !== bytes[i]) return false;
  return true;
}

/** Canonical mime for a buffer by magic bytes, or null when unrecognised. */
export function detectMime(buf: Buffer): (typeof ACCEPTED_UPLOAD_MIMES)[number] | null {
  if (startsWith(buf, MAGIC.pdf.bytes)) return "application/pdf";
  if (startsWith(buf, MAGIC.jpeg.bytes)) return "image/jpeg";
  if (startsWith(buf, MAGIC.png.bytes)) return "image/png";
  return null;
}

/**
 * Returns a human message when the upload is unacceptable, else null.
 * The declared type and the sniffed type must agree: a renamed .exe
 * declared as a PDF is rejected before it is ever written anywhere.
 */
export function sniffUpload(buf: Buffer, declaredMime: string, size: number, maxBytes: number): string | null {
  if (size <= 0 || buf.length === 0) return "The file is empty.";
  if (size > maxBytes || buf.length > maxBytes) return `Files must be ${Math.floor(maxBytes / (1024 * 1024))} MB or smaller.`;
  const detected = detectMime(buf);
  if (!detected) return "File must be a PDF, JPEG or PNG.";
  const declared = declaredMime.toLowerCase().split(";")[0]?.trim() ?? "";
  const family = detected === "application/pdf" ? MAGIC.pdf : detected === "image/jpeg" ? MAGIC.jpeg : MAGIC.png;
  if (!(family.mimes as readonly string[]).includes(declared)) {
    return "File must be a PDF, JPEG or PNG.";
  }
  return null;
}

/**
 * Parse a JSON body with a hard byte budget. Checks Content-Length first,
 * then counts bytes as they stream so a chunked body cannot exceed it.
 * Throws AppError payload_too_large / bad_json.
 */
export async function readJsonLimited(req: Request, maxBytes = 65536): Promise<unknown> {
  const declared = req.headers.get("content-length");
  if (declared !== null) {
    const n = Number(declared);
    if (!Number.isFinite(n) || n < 0) throw new AppError("bad_json", "Content-Length is not a number.");
    if (n > maxBytes) throw new AppError("payload_too_large", "Request body exceeds the limit.");
  }
  const ctype = req.headers.get("content-type") ?? "";
  if (!/^application\/json\b/i.test(ctype)) throw new AppError("bad_json", "Content-Type must be application/json.");

  const body = req.body;
  if (!body) throw new AppError("bad_json", "Request has no body.");

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined);
        throw new AppError("payload_too_large", "Request body exceeds the limit.");
      }
      chunks.push(value);
    }
  }
  const text = Buffer.concat(chunks.map((c) => Buffer.from(c.buffer, c.byteOffset, c.byteLength))).toString("utf8");
  if (text.trim() === "") throw new AppError("bad_json", "Request body is empty.");
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new AppError("bad_json", "Request body is not valid JSON.");
  }
}
