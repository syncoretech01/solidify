/**
 * Browser-side helpers for the onboarding stepper and the health check.
 *
 * Plain fetch, no server imports, safe to use from React components. Every
 * call resolves to a `Result` whose `kind` tells the UI exactly what
 * happened; nothing here throws for a server verdict. The CSRF token is
 * held in module memory only — never localStorage, never a URL.
 */

import type { OnboardingStep } from "./schemas";

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
  | "too_large";

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
  submissionId: string;
  completed: OnboardingStep[];
  complete: boolean;
}
export interface AccessData {
  ok: true;
  csrfToken: string;
  submissionId: string;
}
export interface StepData {
  ok: true;
  step: OnboardingStep;
  saved: true;
}
export interface UploadData {
  ok: true;
  fileId: string;
  name: string;
  bytes: number;
  purpose: UploadPurpose;
}
export interface SubmitData {
  ok: true;
  complete: true;
  submissionId: string;
}
export interface ProgressData {
  ok: true;
  completed: OnboardingStep[];
  complete: boolean;
}
export interface HealthData {
  ok: true;
  onboarding: { configured: boolean; reasons?: string[] };
  inquiry: { configured: boolean; reasons?: string[] };
}

const JSON_TIMEOUT_MS = 10_000;
const UPLOAD_TIMEOUT_MS = 60_000;
const CSRF_HEADER = "x-csrf-token";

const DEFAULT_MESSAGES = {
  offline: "We could not reach the server. Check your connection and try again.",
  timeout: "The request timed out. Check your connection and try again.",
  failed: "That did not save. Nothing was stored — please try again.",
  blocked: "This request was blocked. Reload the page and try again.",
  noSession: "Your onboarding session has expired. Enter your access code again.",
  invalidCode: "That access code was not recognized.",
  invalid: "Please check the highlighted fields.",
  tooLarge: "Files must be 4 MB or smaller.",
  notConfigured:
    "Onboarding is not accepting submissions yet because secure storage is not configured on this server. Nothing you entered has been saved. Please contact Solidify Transport directly.",
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
      return { ...base, kind: "blocked", message: message ?? "This application has already been submitted." };
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

/** POST /api/onboarding/step — validate and store one step. */
export async function saveStep(step: OnboardingStep, data: unknown): Promise<Result<StepData>> {
  const gate = await ensureToken();
  if (gate) return gate as unknown as Result<StepData>;
  return request<StepData>("/api/onboarding/step", jsonInit("POST", { step, data }, true), JSON_TIMEOUT_MS);
}

/** POST /api/onboarding/upload — multipart; returns the fileId to reference from a step. */
export async function uploadFile(purpose: UploadPurpose, file: File): Promise<Result<UploadData>> {
  const gate = await ensureToken();
  if (gate) return gate as unknown as Result<UploadData>;
  const form = new FormData();
  form.set("purpose", purpose);
  form.set("file", file, file.name);
  const headers: Record<string, string> = { accept: "application/json" };
  if (csrfToken) headers[CSRF_HEADER] = csrfToken;
  return request<UploadData>("/api/onboarding/upload", { method: "POST", headers, body: form }, UPLOAD_TIMEOUT_MS);
}

/** POST /api/onboarding/submit — finalise once all five steps are saved. */
export async function submitAll(): Promise<Result<SubmitData>> {
  const gate = await ensureToken();
  if (gate) return gate as unknown as Result<SubmitData>;
  return request<SubmitData>("/api/onboarding/submit", jsonInit("POST", {}, true), JSON_TIMEOUT_MS);
}

/** GET /api/onboarding/progress — which steps are saved. */
export function getProgress(): Promise<Result<ProgressData>> {
  return request<ProgressData>("/api/onboarding/progress", { method: "GET", headers: { accept: "application/json" } }, JSON_TIMEOUT_MS);
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
