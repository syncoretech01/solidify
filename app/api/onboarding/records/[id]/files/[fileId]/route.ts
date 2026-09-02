import { NextResponse } from "next/server";
import { NO_STORE_HEADERS, fail, json, requireAdmin, requireStorage } from "@/lib/server/guards";
import { log } from "@/lib/server/log";
import { getUploadBytes, getUploadMeta, isSafeId } from "@/lib/server/onboarding";
import { clientIp } from "@/lib/server/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; fileId: string }> };

/**
 * GET /api/onboarding/records/:id/files/:fileId   (Bearer ONBOARDING_ADMIN_TOKEN)
 *   200 decrypted bytes, Content-Type from the stored meta, attachment
 *   401 unauthorized · 404 not_found
 */
export async function GET(req: Request, ctx: Ctx) {
  try {
    const storageFail = requireStorage();
    if (storageFail) return storageFail;
    const adminFail = await requireAdmin(req);
    if (adminFail) return adminFail;

    const { id, fileId } = await ctx.params;
    if (!isSafeId(id) || !isSafeId(fileId)) return json({ error: "not_found" }, { status: 404 });

    const meta = await getUploadMeta(id, fileId);
    if (!meta) return json({ error: "not_found" }, { status: 404 });
    const bytes = await getUploadBytes(id, fileId);
    if (!bytes) return json({ error: "not_found" }, { status: 404 });

    log.audit("file_download", { submissionId: id, fileId, purpose: meta.purpose, ip: clientIp(req) });

    const ascii = meta.originalName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_") || "file";
    const utf8 = encodeURIComponent(meta.originalName);
    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        ...NO_STORE_HEADERS,
        "Content-Type": meta.mime,
        "Content-Length": String(bytes.length),
        "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${utf8}`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    return fail(err, "onboarding/records/file");
  }
}
