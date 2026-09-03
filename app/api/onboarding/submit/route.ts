import { NextResponse } from "next/server";
import { ONBOARDING_STEPS } from "@/lib/schemas";
import { requireCsrf } from "@/lib/server/csrf";
import { AppError } from "@/lib/server/errors";
import { fail, json, limit, requireConfigured, requireSession } from "@/lib/server/guards";
import { log } from "@/lib/server/log";
import { finalize, getStep, isComplete, listSteps } from "@/lib/server/onboarding";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/onboarding/submit
 *   200 { ok: true, complete: true, submissionId }
 *   409 { error: "incomplete", missing: [steps] }
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

    if (await isComplete(id)) {
      return json({ ok: true, complete: true, submissionId: id, alreadyComplete: true });
    }

    const completed = await listSteps(id);
    const missing = ONBOARDING_STEPS.filter((s) => !completed.includes(s));
    if (missing.length > 0) throw new AppError("incomplete", "Steps missing.", { missing: [...missing] });

    // The direct-deposit step already stores the verbatim authorization text;
    // the completion record pins the moment it was consented to and which version.
    const directDeposit = await getStep(id, "direct-deposit");
    const version = directDeposit?.payload.authorizationVersion;
    const now = new Date().toISOString();
    await finalize(id, {
      completedAt: now,
      consentAcceptedAt: now,
      consentVersion: typeof version === "string" ? version : null,
      steps: [...completed],
    });
    log.info("onboarding: submission complete", { submissionId: id });
    return json({ ok: true, complete: true, submissionId: id });
  } catch (err) {
    return fail(err, "onboarding/submit");
  }
}
