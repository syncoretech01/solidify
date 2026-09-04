import { getConfig } from "@/lib/server/config";
import { clearCsrfCookie, csrfCookie, newCsrfToken, requireOrigin } from "@/lib/server/csrf";
import { fail, json, limit } from "@/lib/server/guards";
import { clearSessionCookie, readSession, sessionCookie } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/onboarding/session
 *   200 { ok: true, configured: true, csrfToken, reference }  + fresh cookies
 *   200 { ok: false, error: "no_session", configured }
 *       — a probe, not an auth failure: every fresh visitor hits this on
 *         boot, and a 401 would log a console error on a page that must
 *         stay clean.
 *
 * There is no server-side progress to report any more; the six steps live in
 * the browser until they are submitted. A successful read re-issues the
 * session cookie, so an applicant working through the form never has the
 * two-hour window expire underneath them.
 *
 * DELETE → 200 { ok: true }, cookies cleared.
 */
export async function GET(req: Request) {
  try {
    const limited = await limit(req, "session");
    if (limited) return limited;

    const cfg = getConfig();
    if (!cfg.onboardingConfigured) {
      return json({ ok: false, error: "no_session", configured: false }, { status: 200, cookies: [clearSessionCookie(), clearCsrfCookie()] });
    }

    const session = readSession(req);
    if (!session) return json({ ok: false, error: "no_session", configured: true }, { status: 200 });

    const csrfToken = newCsrfToken();
    return json(
      { ok: true, configured: true, csrfToken, reference: session.submissionId },
      { cookies: [sessionCookie(session.submissionId), csrfCookie(csrfToken)] },
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
