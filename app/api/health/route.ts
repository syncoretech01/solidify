import { getConfig } from "@/lib/server/config";
import { json, withLimit } from "@/lib/server/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/health
 * { ok, onboarding: { configured, reasons? }, inquiry: { configured, reasons? } }
 *
 * Reasons are developer-facing and name env vars, never their values.
 *
 * Configured is derived from environment presence alone — deliberately no
 * round trip to the mail provider. Every page boot calls this to decide
 * whether to show the onboarding gate, and pinging a third party per visitor
 * would be slow and a rate-limit hazard. A bad API key is not silent either
 * way: it surfaces as an honest 502 at submit, and the smoke suite has a
 * delivery-failure phase that covers it. Do not add a deep probe here.
 */
export async function GET(req: Request) {
  const limited = await withLimit(req, "health", 30, 10 * 60 * 1000);
  if (limited) return limited;

  const cfg = getConfig();
  return json({
    ok: true,
    onboarding: { configured: cfg.onboardingConfigured, ...(cfg.onboardingConfigured ? {} : { reasons: cfg.onboardingReasons }) },
    inquiry: { configured: cfg.inquiryConfigured, ...(cfg.inquiryConfigured ? {} : { reasons: cfg.inquiryReasons }) },
  });
}
