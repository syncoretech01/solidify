import { NextResponse } from "next/server";
import { z } from "zod";
import { ONBOARDING_STEPS, STEP_SCHEMAS, stepFileFields } from "@/lib/schemas";
import { requireCsrf } from "@/lib/server/csrf";
import { AppError } from "@/lib/server/errors";
import { fail, json, limit, requireConfigured, requireSession } from "@/lib/server/guards";
import { log } from "@/lib/server/log";
import {
  STEP_FILE_PURPOSE,
  getUploadMeta,
  isComplete,
  isSafeId,
  normaliseSecrets,
  putStep,
  type StepPayload,
} from "@/lib/server/onboarding";
import { readJsonLimited } from "@/lib/server/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  step: z.enum(ONBOARDING_STEPS, { message: "Unknown step." }),
  data: z.record(z.string(), z.unknown(), { message: "Step data is missing." }),
});

const FILE_REF_MESSAGE = "Upload is missing or does not belong to this application.";

/**
 * POST /api/onboarding/step  { step, data }
 *   200 { ok: true, step, saved: true }
 *   409 { error: "already_complete" }
 *   422 { error: "validation_failed", fields }
 *   403 csrf/origin · 401 no_session · 503 backend_not_configured
 */
export async function POST(req: Request) {
  try {
    const cfgFail = requireConfigured();
    if (cfgFail) return cfgFail;
    const limited = await limit(req, "step");
    if (limited) return limited;
    const csrfFail = requireCsrf(req);
    if (csrfFail) return csrfFail;
    const session = requireSession(req);
    if (session instanceof NextResponse) return session;
    const id = session.submissionId;

    const body = await readJsonLimited(req, 64 * 1024);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error, "onboarding/step");
    const { step, data } = parsed.data;

    if (await isComplete(id)) throw new AppError("already_complete");

    const result = STEP_SCHEMAS[step].safeParse(data);
    if (!result.success) return fail(result.error, "onboarding/step");
    const payload: StepPayload = normaliseSecrets({ ...result.data });

    // File references must exist in THIS submission and carry the right purpose.
    const purpose = STEP_FILE_PURPOSE[step];
    if (purpose) {
      const fields: Record<string, string> = {};
      for (const field of stepFileFields[step]) {
        const raw = payload[field];
        const ids = Array.isArray(raw) ? raw : [raw];
        for (const fileId of ids) {
          if (!isSafeId(fileId)) {
            fields[field] = FILE_REF_MESSAGE;
            break;
          }
          const meta = await getUploadMeta(id, fileId);
          if (!meta || meta.purpose !== purpose) {
            fields[field] = FILE_REF_MESSAGE;
            break;
          }
        }
      }
      if (Object.keys(fields).length > 0) throw new AppError("validation_failed", "File reference invalid.", { fields });
    }

    await putStep(id, step, payload);
    log.info("onboarding: step saved", { submissionId: id, step });
    return json({ ok: true, step, saved: true });
  } catch (err) {
    return fail(err, "onboarding/step");
  }
}
