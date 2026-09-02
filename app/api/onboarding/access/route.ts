import { z } from "zod";
import { getConfig } from "@/lib/server/config";
import { safeEqual, sha256Hex } from "@/lib/server/crypto";
import { csrfCookie, newCsrfToken, requireOrigin } from "@/lib/server/csrf";
import { fail, json, limit, requireConfigured } from "@/lib/server/guards";
import { log } from "@/lib/server/log";
import { createSubmission } from "@/lib/server/onboarding";
import { clientIp } from "@/lib/server/ratelimit";
import { sessionCookie } from "@/lib/server/session";
import { readJsonLimited } from "@/lib/server/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  code: z.string().trim().min(1, "Enter your access code.").max(128, "Enter your access code."),
});

/**
 * POST /api/onboarding/access  { code }
 *   200 { ok: true, csrfToken, submissionId }  + session & csrf cookies
 *   401 { error: "invalid_code", message }
 *   503 { error: "backend_not_configured", message }
 * The code is hashed and compared against every configured digest without
 * short-circuiting, so a wrong code costs the same time as a right one.
 */
export async function POST(req: Request) {
  try {
    const cfgFail = requireConfigured();
    if (cfgFail) return cfgFail;
    const limited = await limit(req, "access");
    if (limited) return limited;
    const originFail = requireOrigin(req);
    if (originFail) return originFail;

    const body = await readJsonLimited(req, 4096);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error, "onboarding/access");

    const cfg = getConfig();
    const digest = sha256Hex(parsed.data.code);
    let matched = false;
    for (const h of cfg.accessCodeHashes) {
      if (safeEqual(digest, h)) matched = true;
    }
    if (!matched) {
      log.warn("onboarding: access code rejected", { ip: clientIp(req) });
      return json({ error: "invalid_code", message: "That access code was not recognized." }, { status: 401 });
    }

    const submissionId = await createSubmission();
    const csrfToken = newCsrfToken();
    log.info("onboarding: session opened", { submissionId });
    return json({ ok: true, csrfToken, submissionId }, { cookies: [sessionCookie(submissionId), csrfCookie(csrfToken)] });
  } catch (err) {
    return fail(err, "onboarding/access");
  }
}
