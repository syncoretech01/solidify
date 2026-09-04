/**
 * Browser-side helpers for the onboarding stepper and the health check.
 *
 * Plain fetch, no server imports, safe to use from React components. Every
 * call resolves to a `Result` whose `kind` tells the UI exactly what
 * happened; nothing here throws for a server verdict. The CSRF token is
 * held in module memory only — never localStorage, never a URL.
 */

import type { OnboardingStep } from "./schemas";

export interface SubmitFile {
  id: string;
  purpose: UploadPurpose;
  file: File;
}

export type Kind =
  | "saved"
  | "invalid"
  | "blocked"
  | "rate_limited"
  | "not_configured"
  | "incomplete"
  | "failed"
  | "offline"
  | "no_session"
  | "invalid_code"
  | "too_large"
  | "delivery_failed";

export interface Result<T = unknown> {
  kind: Kind;
  /** `kind === "saved"`. */
  ok: boolean;
  /** HTTP status, or 0 when the request never completed. */
  status: number;
  message?: string;
  /** Per-field messages on `invalid`. */
  fields?: Record<string, string>;
  /** Steps still missing on `incomplete`. */
  missing?: OnboardingStep[];
  /** Seconds to wait on `rate_limited`. */
  retryAfter?: number;
  data?: T;
}

export type UploadPurpose = "certificate" | "w9" | "voided-check";

export interface SessionData {
  ok: true;
  configured: boolean;
  csrfToken: string;
  reference: string;
}
export interface AccessData {
  ok: true;
  csrfToken: string;
  reference: string;
}
export interface SubmitData {
  ok: true;
  reference: string;
  deliveredAt: string;
}
export interface HealthData {
  ok: true;
  onboarding: { configured: boolean; reasons?: string[] };
  inquiry: { configured: boolean; reasons?: string[] };
}

const JSON_TIMEOUT_MS = 10_000;
// One request carries every document; a slow uplink needs room, and the
// caller drives a real progress bar off XHR rather than showing a dead spinner.
const SUBMIT_TIMEOUT_MS = 150_000;
const CSRF_HEADER = "x-csrf-token";

const DEFAULT_MESSAGES = {
  offline: "We could not reach the server. Check your connection and try again.",
  timeout: "The request timed out. Check your connection and try again.",
  failed: "That did not send. Nothing was saved — please try again.",
  blocked: "This request was blocked. Reload the page and try again.",
  noSession: "Your onboarding session has expired. Enter your access code again.",
  invalidCode: "That access code was not recognized.",
  invalid: "Please check the highlighted fields.",
  tooLarge: "Each document must be 2 MB or smaller.",
  deliveryFailed:
    "We could not deliver your submission, so it was not accepted. Nothing was saved anywhere. Your answers and documents are still on this page — press submit again, or call (510) 499-4552.",
  notConfigured:
    "Onboarding is not accepting submissions yet because delivery is not configured on this server. Nothing you enter here is saved or sent. Please contact Solidify Transport directly.",
  rateLimited: "Too many attempts. Please wait a few minutes and try again.",
} as const;

let csrfToken: string | null = null;

export function hasCsrfToken(): boolean {
  return csrfToken !== null;
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function fieldsOf(x: unknown): Record<string, string> {
  if (!isRecord(x)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(x)) if (typeof v === "string") out[k] = v;
  return out;
}

/** Turn any API response into a Result. Exported so tests can drive it directly. */
export async function interpret<T = unknown>(res: Response): Promise<Result<T>> {
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  const b: Record<string, unknown> = isRecord(body) ? body : {};
  const error = typeof b.error === "string" ? b.error : undefined;
  const message = typeof b.message === "string" ? b.message : undefined;

  // A 200 with ok:false is an explicit negative answer to a probe (currently
  // only the session probe's "no session") — never a success.
  if (res.ok && b.ok === false) {
    if (error === "no_session") {
      csrfToken = null;
      return { kind: "no_session", ok: false, status: res.status, message: message ?? DEFAULT_MESSAGES.noSession };
    }
    return { kind: "failed", ok: false, status: res.status, message: message ?? DEFAULT_MESSAGES.failed };
  }

  if (res.ok) {
    if (typeof b.csrfToken === "string") csrfToken = b.csrfToken;
    return { kind: "saved", ok: true, status: res.status, data: b as T, message };
  }

  const base = { ok: false as const, status: res.status };
  switch (res.status) {
    case 400:
      return { ...base, kind: "invalid", fields: {}, message: message ?? DEFAULT_MESSAGES.invalid };
    case 401:
      if (error === "invalid_code") return { ...base, kind: "invalid_code", message: message ?? DEFAULT_MESSAGES.invalidCode };
      csrfToken = null;
      return { ...base, kind: "no_session", message: message ?? DEFAULT_MESSAGES.noSession };
    case 403:
      return { ...base, kind: "blocked", message: message ?? DEFAULT_MESSAGES.blocked };
    case 409:
      if (error === "incomplete") {
        const missing = Array.isArray(b.missing) ? (b.missing.filter((m) => typeof m === "string") as OnboardingStep[]) : [];
        return { ...base, kind: "incomplete", missing, message: message ?? "Finish every step before submitting." };
      }
      return { ...base, kind: "blocked", message: message ?? "Finish every step before submitting." };
    case 413:
      return { ...base, kind: "too_large", message: message ?? DEFAULT_MESSAGES.tooLarge };
    case 422:
      return { ...base, kind: "invalid", fields: fieldsOf(b.fields), message: message ?? DEFAULT_MESSAGES.invalid };
    case 429: {
      const header = Number(res.headers.get("retry-after"));
      const fromBody = typeof b.retryAfter === "number" ? b.retryAfter : NaN;
      const retryAfter = Number.isFinite(fromBody) ? fromBody : Number.isFinite(header) ? header : 60;
      return { ...base, kind: "rate_limited", retryAfter, message: message ?? DEFAULT_MESSAGES.rateLimited };
    }
    case 502:
      return { ...base, kind: "delivery_failed", message: message ?? DEFAULT_MESSAGES.deliveryFailed };
    case 503:
      return { ...base, kind: "not_configured", message: message ?? DEFAULT_MESSAGES.notConfigured };
    default:
      return { ...base, kind: "failed", message: message ?? DEFAULT_MESSAGES.failed };
  }
}

async function request<T>(path: string, init: RequestInit, timeoutMs: number): Promise<Result<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(path, { ...init, credentials: "same-origin", cache: "no-store", signal: controller.signal });
    return await interpret<T>(res);
  } catch (err) {
    const aborted = err instanceof DOMException ? err.name === "AbortError" : (err as { name?: string })?.name === "AbortError";
    return { kind: "offline", ok: false, status: 0, message: aborted ? DEFAULT_MESSAGES.timeout : DEFAULT_MESSAGES.offline };
  } finally {
    clearTimeout(timer);
  }
}

function jsonInit(method: string, body: unknown, withCsrf: boolean): RequestInit {
  const headers: Record<string, string> = { "content-type": "application/json", accept: "application/json" };
  if (withCsrf && csrfToken) headers[CSRF_HEADER] = csrfToken;
  return { method, headers, body: JSON.stringify(body) };
}

/** Make sure a CSRF token is in memory, opening the session if needed. */
async function ensureToken(): Promise<Result<SessionData> | null> {
  if (csrfToken) return null;
  const opened = await openSession();
  return opened.ok ? null : opened;
}

/* ── public API ──────────────────────────────────────────────────────────── */

/** GET /api/onboarding/session — resume an unlocked session, refreshes the CSRF token. */
export function openSession(): Promise<Result<SessionData>> {
  return request<SessionData>("/api/onboarding/session", { method: "GET", headers: { accept: "application/json" } }, JSON_TIMEOUT_MS);
}

/** POST /api/onboarding/access — exchange an access code for a session. */
export function unlock(code: string): Promise<Result<AccessData>> {
  return request<AccessData>("/api/onboarding/access", jsonInit("POST", { code }, false), JSON_TIMEOUT_MS);
}

/**
 * POST /api/onboarding/submit — the whole application, once.
 *
 * Every step and every document travels in one multipart request. There is no
 * per-step save and no per-file upload: this site keeps no record, so nothing
 * exists server-side until the applicant presses submit, and a 200 means the
 * submission was delivered to Solidify.
 *
 * XHR rather than fetch, because `fetch` cannot report upload progress and a
 * silent ninety-second wait on a slow uplink reads as a hang.
 */
export async function submitAll(payload: unknown, files: SubmitFile[], onProgress?: (fraction: number) => void): Promise<Result<SubmitData>> {
  const gate = await ensureToken();
  if (gate) return gate as unknown as Result<SubmitData>;

  const form = new FormData();
  form.set("data", JSON.stringify(payload));
  for (const f of files) form.append(`file.${f.purpose}.${f.id}`, f.file, f.file.name);

  return new Promise<Result<SubmitData>>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/onboarding/submit", true);
    xhr.timeout = SUBMIT_TIMEOUT_MS;
    xhr.responseType = "text";
    xhr.setRequestHeader("accept", "application/json");
    if (csrfToken) xhr.setRequestHeader(CSRF_HEADER, csrfToken);
    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && e.total > 0) onProgress(Math.min(1, e.loaded / e.total));
      };
    }
    xhr.onload = () => {
      const body = new Response(xhr.responseText, {
        status: xhr.status,
        headers: { "content-type": xhr.getResponseHeader("content-type") ?? "application/json" },
      });
      void interpret<SubmitData>(body).then(resolve);
    };
    xhr.ontimeout = () => resolve({ ok: false, status: 0, kind: "offline", message: DEFAULT_MESSAGES.timeout });
    xhr.onerror = () => resolve({ ok: false, status: 0, kind: "offline", message: DEFAULT_MESSAGES.offline });
    xhr.send(form);
  });
}

/** DELETE /api/onboarding/session — clear cookies and forget the token. */
export async function endSession(): Promise<Result<{ ok: true }>> {
  const result = await request<{ ok: true }>("/api/onboarding/session", { method: "DELETE", headers: { accept: "application/json" } }, JSON_TIMEOUT_MS);
  csrfToken = null;
  return result;
}

/** GET /api/health — whether the pipelines are configured (developer-facing reasons when not). */
export function checkHealth(): Promise<Result<HealthData>> {
  return request<HealthData>("/api/health", { method: "GET", headers: { accept: "application/json" } }, JSON_TIMEOUT_MS);
}
