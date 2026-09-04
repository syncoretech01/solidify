/**
 * Rate limiting with two drivers.
 *
 *   memory  — sliding window over a Map of timestamps. Per process. On
 *             serverless this means per warm instance: a limit, but a soft
 *             one, and it resets on cold start.
 *   upstash — Redis over REST. A fixed window keyed by bucket+ip, shared
 *             across every instance. If Upstash errors, the call falls back
 *             to the memory driver and says so in a warn log; it never
 *             fails open silently and never fails the request.
 */

import { getConfig } from "./config";
import { log } from "./log";

export interface RateLimitResult {
  ok: boolean;
  retryAfterSec: number;
}

export interface RateLimiter {
  hit(key: string, max: number, windowMs: number): Promise<RateLimitResult>;
}

export const WINDOW_10_MIN = 10 * 60 * 1000;

export const LIMITS = {
  access: { max: 10, windowMs: WINDOW_10_MIN },
  // Generous enough for an operator retrying a failed delivery, tight enough
  // that the submit endpoint cannot be used as a mail cannon.
  submit: { max: 5, windowMs: WINDOW_10_MIN },
  inquiry: { max: 8, windowMs: WINDOW_10_MIN },
  session: { max: 60, windowMs: WINDOW_10_MIN },
} as const;

export type LimitBucket = keyof typeof LIMITS;

const SWEEP_EVERY_MS = 60 * 1000;
const SWEEP_IDLE_MS = 60 * 60 * 1000;
const MAX_KEYS = 20_000;

export class MemoryRateLimiter implements RateLimiter {
  private readonly hits = new Map<string, number[]>();
  private sweeper: ReturnType<typeof setInterval> | null = null;

  async hit(key: string, max: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    this.ensureSweeper();
    const live = (this.hits.get(key) ?? []).filter((t) => t > now - windowMs);
    if (live.length >= max) {
      this.hits.set(key, live);
      const oldest = live[0] ?? now;
      return { ok: false, retryAfterSec: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)) };
    }
    live.push(now);
    this.hits.set(key, live);
    if (this.hits.size > MAX_KEYS) this.sweep(now);
    if (this.hits.size > MAX_KEYS) this.hits.clear();
    return { ok: true, retryAfterSec: 0 };
  }

  private sweep(now: number): void {
    for (const [k, arr] of this.hits) {
      const newest = arr[arr.length - 1] ?? 0;
      if (newest < now - SWEEP_IDLE_MS) this.hits.delete(k);
    }
  }

  private ensureSweeper(): void {
    if (this.sweeper) return;
    this.sweeper = setInterval(() => this.sweep(Date.now()), SWEEP_EVERY_MS);
    if (typeof this.sweeper === "object" && "unref" in this.sweeper) this.sweeper.unref();
  }
}

interface UpstashReply {
  result?: unknown;
  error?: string;
}

export class UpstashRateLimiter implements RateLimiter {
  constructor(
    private readonly url: string,
    private readonly token: string,
    private readonly fallback: RateLimiter,
  ) {}

  async hit(key: string, max: number, windowMs: number): Promise<RateLimitResult> {
    const k = `rl:${key}`;
    try {
      const replies = await this.pipeline([
        ["SET", k, "0", "NX", "PX", String(windowMs)],
        ["INCR", k],
        ["PTTL", k],
      ]);
      const count = Number(replies[1]?.result);
      const ttl = Number(replies[2]?.result);
      if (!Number.isFinite(count)) throw new Error(replies[1]?.error ?? "INCR returned no number");
      if (Number.isFinite(ttl) && ttl < 0) {
        // Key exists without an expiry (should not happen; repair, best effort).
        void this.pipeline([["PEXPIRE", k, String(windowMs)]]).catch(() => undefined);
      }
      if (count > max) {
        const remaining = Number.isFinite(ttl) && ttl > 0 ? ttl : windowMs;
        return { ok: false, retryAfterSec: Math.max(1, Math.ceil(remaining / 1000)) };
      }
      return { ok: true, retryAfterSec: 0 };
    } catch (err) {
      log.warn("ratelimit: upstash unavailable, using per-instance memory limiter for this call", {
        error: err instanceof Error ? err.message : String(err),
      });
      return this.fallback.hit(key, max, windowMs);
    }
  }

  private async pipeline(commands: string[][]): Promise<UpstashReply[]> {
    const res = await fetch(`${this.url}/pipeline`, {
      method: "POST",
      headers: { authorization: `Bearer ${this.token}`, "content-type": "application/json" },
      body: JSON.stringify(commands),
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) throw new Error(`upstash responded ${res.status}`);
    const body = (await res.json()) as unknown;
    if (!Array.isArray(body)) throw new Error("upstash pipeline reply was not an array");
    return body as UpstashReply[];
  }
}

let limiter: RateLimiter | undefined;

export function getRateLimiter(): RateLimiter {
  if (limiter) return limiter;
  const cfg = getConfig();
  const memory = new MemoryRateLimiter();
  limiter = cfg.upstash ? new UpstashRateLimiter(cfg.upstash.url, cfg.upstash.token, memory) : memory;
  return limiter;
}

/**
 * Client address for rate-limit keys. First hop of x-forwarded-for (set by
 * Vercel and by any sane reverse proxy), then x-real-ip, else "unknown".
 * Behind no proxy at all, the header is client-controlled and only
 * "unknown" is trustworthy; the limit still applies to that shared bucket.
 */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const real = req.headers.get("x-real-ip")?.trim();
  return real ? real.slice(0, 64) : "unknown";
}
