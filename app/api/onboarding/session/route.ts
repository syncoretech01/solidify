import { getConfig } from "@/lib/server/config";
import { clearCsrfCookie, csrfCookie, newCsrfToken, requireOrigin } from "@/lib/server/csrf";
import { fail, json, limit } from "@/lib/server/guards";
import { exists, isComplete, listSteps } from "@/lib/server/onboarding";
import { clearSessionCookie, readSession } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/onboarding/session
 *   200 { ok: true, configured: true, csrfToken, submissionId, completed, complete }  + fresh csrf cookie
 *   401 { error: "no_session", configured }
 * DELETE /api/onboarding/session → 200 { ok: true }, cookies cleared.
 */
export async function GET(req: Request) {
  try {
    const limited = await limit(req, "session");
    if (limited) return limited;

    const cfg = getConfig();
    if (!cfg.onboardingConfigured) {
      return json({ error: "no_session", configured: false }, { status: 401, cookies: [clearSessionCookie(), clearCsrfCookie()] });
    }

    const session = readSession(req);
    if (!session) return json({ error: "no_session", configured: true }, { status: 401 });

    const id = session.submissionId;
    if (!(await exists(id))) {
      return json({ error: "no_session", configured: true }, { status: 401, cookies: [clearSessionCookie(), clearCsrfCookie()] });
    }

    const [completed, complete] = await Promise.all([listSteps(id), isComplete(id)]);
    const csrfToken = newCsrfToken();
    return json(
      { ok: true, configured: true, csrfToken, submissionId: id, completed, complete },
      { cookies: [csrfCookie(csrfToken)] },
    );
  } catch (err) {
    return fail(err, "onboarding/session");
  }
}

export async function DELETE(req: Request) {
  try {
    const limited = await limit(req, "session");
    if (limited) return limited;
    const originFail = requireOrigin(req);
    if (originFail) return originFail;
    return json({ ok: true }, { cookies: [clearSessionCookie(), clearCsrfCookie()] });
  } catch (err) {
    return fail(err, "onboarding/session");
  }
}
