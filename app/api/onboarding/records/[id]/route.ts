import { fail, json, requireAdmin, requireStorage } from "@/lib/server/guards";
import { log } from "@/lib/server/log";
import { deleteSubmission, exists, getSubmissionRecord, isSafeId } from "@/lib/server/onboarding";
import { clientIp } from "@/lib/server/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/onboarding/records/:id           (Bearer ONBOARDING_ADMIN_TOKEN)
 *   200 { ok: true, submissionId, createdAt, complete, completedAt, masked, steps, files }
 *   Secrets are masked ("•••• 1234") unless ?reveal=1, which is audit-logged.
 *   401 unauthorized · 404 not_found · 503 admin_not_configured | backend_not_configured
 * DELETE /api/onboarding/records/:id → 200 { ok: true, deleted: <object count> }
 */
export async function GET(req: Request, ctx: Ctx) {
  try {
    const storageFail = requireStorage();
    if (storageFail) return storageFail;
    const adminFail = await requireAdmin(req);
    if (adminFail) return adminFail;

    const { id } = await ctx.params;
    if (!isSafeId(id)) return json({ error: "not_found" }, { status: 404 });

    const reveal = new URL(req.url).searchParams.get("reveal") === "1";
    const record = await getSubmissionRecord(id, { reveal });
    if (!record) return json({ error: "not_found" }, { status: 404 });

    if (reveal) log.audit("reveal", { submissionId: id, ip: clientIp(req) });
    else log.audit("view", { submissionId: id, ip: clientIp(req) });
    return json({ ok: true, ...record });
  } catch (err) {
    return fail(err, "onboarding/records");
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const storageFail = requireStorage();
    if (storageFail) return storageFail;
    const adminFail = await requireAdmin(req);
    if (adminFail) return adminFail;

    const { id } = await ctx.params;
    if (!isSafeId(id)) return json({ error: "not_found" }, { status: 404 });
    if (!(await exists(id))) return json({ error: "not_found" }, { status: 404 });

    const deleted = await deleteSubmission(id);
    log.audit("delete", { submissionId: id, objects: deleted, ip: clientIp(req) });
    return json({ ok: true, deleted });
  } catch (err) {
    return fail(err, "onboarding/records");
  }
}
