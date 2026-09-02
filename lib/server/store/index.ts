/**
 * Object store abstraction. Keys are "/"-separated paths; values are bytes
 * that are already encrypted by the caller. The store never sees plaintext.
 *
 * `getStore()` throws `backend_not_configured` when the environment does
 * not describe a usable store. Nothing above it catches that to fake a
 * write: the request answers 503 and nothing is persisted.
 */

import { getConfig } from "../config";
import { AppError } from "../errors";

export interface ObjectStore {
  readonly kind: "fs" | "s3";
  put(key: string, bytes: Buffer): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  list(prefix: string): Promise<string[]>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  /** Cheap reachability probe: HeadBucket for s3, mkdir+writable for fs. */
  ping(): Promise<void>;
}

const SAFE_KEY = /^[A-Za-z0-9_\-./]+$/;

export function assertSafeKey(key: string): void {
  if (
    typeof key !== "string" ||
    key.length === 0 ||
    key.length > 512 ||
    !SAFE_KEY.test(key) ||
    key.startsWith("/") ||
    key.split("/").some((seg) => seg === "" || seg === "." || seg === "..")
  ) {
    throw new Error("unsafe object key");
  }
}

let store: ObjectStore | undefined;

export async function getStore(): Promise<ObjectStore> {
  if (store) return store;
  const cfg = getConfig();
  if (!cfg.storeConfigured) {
    throw new AppError("backend_not_configured", `Object store is not configured: ${cfg.storeReasons.join("; ")}`);
  }
  if (cfg.storeKind === "s3" && cfg.s3) {
    const { S3Store } = await import("./s3");
    store = new S3Store(cfg.s3);
    return store;
  }
  if (cfg.storeKind === "fs" && cfg.fsDir) {
    const { FsStore } = await import("./fs");
    store = new FsStore(cfg.fsDir);
    return store;
  }
  throw new AppError("backend_not_configured", "Object store kind is not recognised.");
}

export interface StoreHealth {
  ok: boolean;
  kind: "fs" | "s3" | null;
  error?: string;
}

/** Health-check helper: configured AND reachable, with a bounded wait. */
export async function storeHealth(timeoutMs = 4000): Promise<StoreHealth> {
  const cfg = getConfig();
  if (!cfg.storeConfigured) return { ok: false, kind: cfg.storeKind, error: cfg.storeReasons.join("; ") };
  try {
    const s = await getStore();
    await Promise.race([
      s.ping(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("store ping timed out")), timeoutMs).unref?.()),
    ]);
    return { ok: true, kind: s.kind };
  } catch (err) {
    return { ok: false, kind: cfg.storeKind, error: err instanceof Error ? `${err.name}: ${err.message}` : String(err) };
  }
}
