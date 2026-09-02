/**
 * JSON-line logger with a redactor in front of everything.
 *
 * Two rules, applied to the message and to metadata (objects walked to
 * depth 8):
 *   1. Any key that looks like it names a secret is replaced wholesale.
 *   2. Any run of seven or more digits (spaces/dashes between them allowed)
 *      inside a string is replaced. That is every TIN, EIN, routing and
 *      account number, and most phone numbers. It also eats some dates
 *      and long counters in strings; that is the accepted cost.
 * Buffers never print; they become "[buffer Nb]".
 *
 * Writes go straight to stdout/stderr rather than console.* so the
 * production console stripper in next.config.ts cannot swallow audit lines.
 */

type Level = "debug" | "info" | "warn" | "error";

const KEY_DENY = /(ssn|tin\b|ein\b|tax[_-]?id|routing|account[_-]?(number|no)\b|acct|iban|swift|dob|card|cvv|password|secret|token|code)/i;
const DIGIT_RUN = /(?:\d[ -]?){6,}\d/g;
const MAX_DEPTH = 8;
const REDACTED = "[redacted]";

export function redactString(s: string): string {
  return s.replace(DIGIT_RUN, REDACTED);
}

export function redact(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return redactString(value);
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return value;
  if (Buffer.isBuffer(value)) return `[buffer ${value.length}b]`;
  if (value instanceof Uint8Array) return `[buffer ${value.byteLength}b]`;
  if (value instanceof Date) return redactString(value.toISOString());
  if (depth >= MAX_DEPTH) return "[depth]";
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message),
      stack: value.stack ? redactString(value.stack) : undefined,
    };
  }
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = KEY_DENY.test(k) ? REDACTED : redact(v, depth + 1);
    }
    return out;
  }
  if (typeof value === "function") return "[function]";
  return String(value);
}

function emit(level: Level, msg: string, meta?: unknown): void {
  if (level === "debug" && process.env.NODE_ENV === "production" && !process.env.LOG_DEBUG) return;
  const line: Record<string, unknown> = { t: new Date().toISOString(), level, msg: redactString(msg) };
  if (meta !== undefined) line.meta = redact(meta);
  let text: string;
  try {
    text = JSON.stringify(line);
  } catch {
    text = JSON.stringify({ t: line.t, level, msg: line.msg, meta: "[unserialisable]" });
  }
  if (level === "warn" || level === "error") process.stderr.write(text + "\n");
  else process.stdout.write(text + "\n");
}

export const log = {
  debug(msg: string, meta?: unknown): void {
    emit("debug", msg, meta);
  },
  info(msg: string, meta?: unknown): void {
    emit("info", msg, meta);
  },
  warn(msg: string, meta?: unknown): void {
    emit("warn", msg, meta);
  },
  /** Logs the message plus the error's name, message and stack. Never the request body. */
  error(msg: string, err?: unknown, meta?: Record<string, unknown>): void {
    const errPart =
      err instanceof Error
        ? { name: err.name, message: err.message, stack: err.stack }
        : err === undefined
          ? undefined
          : { message: typeof err === "string" ? err : safeStringify(err) };
    emit("error", msg, { ...(meta ?? {}), ...(errPart ? { error: errPart } : {}) });
  },
  /** Audit trail line for reviewer actions. Always emitted. */
  audit(event: string, meta: Record<string, unknown>): void {
    emit("info", `audit:${event}`, { audit: true, event, ...meta });
  },
};

function safeStringify(v: unknown): string {
  try {
    return JSON.stringify(v) ?? String(v);
  } catch {
    return String(v);
  }
}
