/**
 * Coded errors shared by every server layer.
 *
 * Lower layers (store, crypto, record layer) throw these; `guards.fail()`
 * turns them into HTTP responses. Keeping the class here means the store
 * never has to import `next/server`.
 */

export type AppErrorCode =
  | "backend_not_configured"
  | "inquiry_not_configured"
  | "admin_not_configured"
  | "payload_too_large"
  | "file_too_large"
  | "bad_json"
  | "bad_form"
  | "validation_failed"
  | "rate_limited"
  | "not_found"
  | "key_mismatch"
  | "decrypt_failed"
  | "already_complete"
  | "incomplete";

export interface AppErrorExtra {
  fields?: Record<string, string>;
  missing?: string[];
  retryAfterSec?: number;
}

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly fields?: Record<string, string>;
  readonly missing?: string[];
  readonly retryAfterSec?: number;

  constructor(code: AppErrorCode, message?: string, extra: AppErrorExtra = {}) {
    super(message ?? code);
    this.name = "AppError";
    this.code = code;
    if (extra.fields) this.fields = extra.fields;
    if (extra.missing) this.missing = extra.missing;
    if (extra.retryAfterSec !== undefined) this.retryAfterSec = extra.retryAfterSec;
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

/** Best-effort `code` from anything thrown, including plain `{ code }` objects. */
export function errorCode(err: unknown): string | undefined {
  if (err && typeof err === "object" && "code" in err) {
    const c = (err as { code?: unknown }).code;
    return typeof c === "string" ? c : undefined;
  }
  return undefined;
}
