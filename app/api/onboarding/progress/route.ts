import { NextResponse } from "next/server";
import { fail, json, limit, requireConfigured, requireSession } from "@/lib/server/guards";
import { exists, isComplete, listSteps } from "@/lib/server/onboarding";
import { clearSessionCookie } from "@/lib/server/session";
import { clearCsrfCookie } from "@/lib/server/csrf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/onboarding/progress
 *   200 { ok: true, completed: [steps], complete }
 *   401 { error: "no_session" }
 */
export async function GET(req: Request) {
  try {
    const cfgFail = requireConfigured();
    if (cfgFail) return cfgFail;
    const limited = await limit(req, "session");
    if (limited) return limited;
    const session = requireSession(req);
    if (session instanceof NextResponse) return session;
    const id = session.submissionId;

    if (!(await exists(id))) {
      return json({ error: "no_session" }, { status: 401, cookies: [clearSessionCookie(), clearCsrfCookie()] });
    }
    const [completed, complete] = await Promise.all([listSteps(id), isComplete(id)]);
    return json({ ok: true, completed, complete });
  } catch (err) {
    return fail(err, "onboarding/progress");
  }
}
