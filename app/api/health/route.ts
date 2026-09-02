import { getConfig } from "@/lib/server/config";
import { json, withLimit } from "@/lib/server/guards";
import { redactString } from "@/lib/server/log";
import { storeHealth } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/health
 * { ok, onboarding: { configured, reasons? }, inquiry: { configured, reasons? } }
 * Reasons are developer-facing and name env vars, never their values.
 * When a store is configured it is pinged, so a wrong bucket shows up here
 * rather than as a 500 on somebody's first save.
 */
export async function GET(req: Request) {
  const limited = await withLimit(req, "health", 30, 10 * 60 * 1000);
  if (limited) return limited;

  const cfg = getConfig();
  let onboardingConfigured = cfg.onboardingConfigured;
  let inquiryConfigured = cfg.inquiryConfigured;
  const onboardingReasons = [...cfg.onboardingReasons];
  const inquiryReasons = [...cfg.inquiryReasons];

  if (cfg.storeConfigured) {
    const health = await storeHealth();
    if (!health.ok) {
      const reason = redactString(`store ping failed (${health.kind ?? "?"}): ${health.error ?? "unknown"}`);
      onboardingConfigured = false;
      onboardingReasons.push(reason);
      if (!cfg.mailConfigured) {
        inquiryConfigured = false;
        inquiryReasons.push(reason);
      }
    }
  }

  return json({
    ok: true,
    onboarding: { configured: onboardingConfigured, ...(onboardingConfigured ? {} : { reasons: onboardingReasons }) },
    inquiry: { configured: inquiryConfigured, ...(inquiryConfigured ? {} : { reasons: inquiryReasons }) },
  });
}
