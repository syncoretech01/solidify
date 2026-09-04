/**
 * Client-side document reduction.
 *
 * A phone photograph of a voided check is routinely 5–8 MB, and one request
 * carries every document in the submission. Images are decoded, drawn to a
 * canvas at a sane document resolution and re-encoded as JPEG until they fit.
 * PDFs pass through untouched — re-encoding them would need a PDF library and
 * would risk the very legibility this is protecting.
 *
 * 2200px on the long edge is roughly 200 dpi for a letter page: the MICR line
 * on a check and the TIN box on a W-9 stay readable. The 1400px floor is the
 * point below which we would rather refuse the file than deliver an
 * unreadable routing number.
 */

export const TARGET_BYTES = 1024 * 1024; // 1 MiB — comfortably inside the per-file cap
const LONG_EDGE = 2200;
const RETRY_LONG_EDGE = 1600;
const FLOOR_LONG_EDGE = 1400;
const QUALITIES = [0.82, 0.72, 0.62, 0.52];
const REDUCIBLE = new Set(["image/jpeg", "image/png"]);

export interface Reduced {
  file: File;
  originalBytes: number;
  reduced: boolean;
}

const canReduce = (file: File) => REDUCIBLE.has(file.type) && typeof document !== "undefined";

async function decode(file: File): Promise<{ width: number; height: number; draw: CanvasImageSource; release: () => void }> {
  if (typeof createImageBitmap === "function") {
    const bmp = await createImageBitmap(file);
    return { width: bmp.width, height: bmp.height, draw: bmp, release: () => bmp.close() };
  }
  // Safari fallback: an <img> off a blob URL, revoked either way.
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode failed"));
      el.src = url;
    });
    return { width: img.naturalWidth, height: img.naturalHeight, draw: img, release: () => URL.revokeObjectURL(url) };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

function encode(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

async function renderAt(src: CanvasImageSource, w: number, h: number, longEdge: number, quality: number): Promise<Blob | null> {
  const scale = Math.min(1, longEdge / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  return encode(canvas, quality);
}

/**
 * Reduce an image if it is worth reducing. Always returns a file: on any
 * failure, or when the result would be larger than the original, the original
 * comes back untouched.
 */
export async function downscaleIfImage(file: File): Promise<Reduced> {
  const originalBytes = file.size;
  if (!canReduce(file)) return { file, originalBytes, reduced: false };

  let handle: Awaited<ReturnType<typeof decode>> | null = null;
  try {
    handle = await decode(file);
    const { width, height, draw } = handle;
    const oversize = originalBytes > TARGET_BYTES || Math.max(width, height) > LONG_EDGE;
    if (!oversize) return { file, originalBytes, reduced: false };

    let best: Blob | null = null;
    for (const q of QUALITIES) {
      const blob = await renderAt(draw, width, height, LONG_EDGE, q);
      if (!blob) break;
      best = blob;
      if (blob.size <= TARGET_BYTES) break;
    }
    if (best && best.size > TARGET_BYTES && Math.max(width, height) > FLOOR_LONG_EDGE) {
      const smaller = await renderAt(draw, width, height, Math.max(RETRY_LONG_EDGE, FLOOR_LONG_EDGE), 0.7);
      if (smaller && smaller.size < best.size) best = smaller;
    }
    if (!best || best.size >= originalBytes) return { file, originalBytes, reduced: false };

    const name = file.name.replace(/\.(png|jpe?g)$/i, "") + ".jpg";
    return { file: new File([best], name, { type: "image/jpeg", lastModified: file.lastModified }), originalBytes, reduced: true };
  } catch {
    return { file, originalBytes, reduced: false };
  } finally {
    handle?.release();
  }
}

/** "6.2 MB", "412 KB" — for messages the applicant reads. */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
