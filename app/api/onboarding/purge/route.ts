import { getConfig } from "@/lib/server/config";
import { fail, json, requireAdminOrCron, requireStorage } from "@/lib/server/guards";
import { log } from "@/lib/server/log";
import { purgeOlderThan } from "@/lib/server/onboarding";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST or GET /api/onboarding/purge
 *   Authorization: Bearer <ONBOARDING_ADMIN_TOKEN>  or  Bearer <CRON_SECRET>
 *   200 { ok: true, deleted, kept, errors, retentionDays }
 * Vercel Cron (vercel.json, 04:00 UTC daily) calls this with GET and the
 * CRON_SECRET bearer, so both verbs are served by the same handler.
 */
async function run(req: Request) {
  try {
    const storageFail = requireStorage();
    if (storageFail) return storageFail;
    const authFail = await requireAdminOrCron(req);
    if (authFail) return authFail;

    const { retentionDays } = getConfig();
    const result = await purgeOlderThan(retentionDays);
    log.audit("purge", { retentionDays, deleted: result.deleted.length, kept: result.kept, errors: result.errors });
    return json({ ok: true, deleted: result.deleted.length, kept: result.kept, errors: result.errors, retentionDays });
  } catch (err) {
    return fail(err, "onboarding/purge");
  }
}

export const POST = run;
export const GET = run;
