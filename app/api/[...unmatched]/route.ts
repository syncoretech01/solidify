import { NO_STORE_HEADERS } from "@/lib/server/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Anything under /api that is not a real route.
 *
 * Without this, a POST to a path that no longer exists falls through to the
 * app's not-found page and answers 200 with HTML — which reads, to any client,
 * as "accepted". Several endpoints were removed when submission storage was
 * (step, upload, progress, purge, records), so this is not hypothetical: it is
 * exactly the shape of a stale client still trying to save a step.
 *
 * A JSON 404 on every method, and never a cached one.
 */
function gone(): Response {
  return Response.json({ error: "not_found" }, { status: 404, headers: NO_STORE_HEADERS });
}

export const GET = gone;
export const POST = gone;
export const PUT = gone;
export const PATCH = gone;
export const DELETE = gone;
export const HEAD = gone;
export const OPTIONS = gone;
