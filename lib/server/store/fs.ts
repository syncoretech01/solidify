/**
 * Filesystem object store. Development and long-lived Node hosts only.
 *
 * Refused outright on Vercel: the function filesystem is ephemeral, so a
 * write there would "succeed" and vanish. That is the one failure mode
 * this whole system is built to avoid.
 *
 * Writes are atomic: temp file in the same directory → fsync → rename.
 * Directories are 0o700 and files 0o600 (advisory on Windows).
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { assertSafeKey, type ObjectStore } from "./index";

const DIR_MODE = 0o700;
const FILE_MODE = 0o600;

/**
 * rename() replaces an existing destination atomically on POSIX. On Windows
 * the same call can fail with a transient EPERM/EBUSY while an antivirus or
 * indexer briefly holds the just-written destination, so re-saving a step
 * would 500 for no good reason. Retry with a short backoff; the write itself
 * is already durable in the temp file.
 */
async function renameWithRetry(from: string, to: string): Promise<void> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      await fs.rename(from, to);
      return;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException)?.code;
      if (code !== "EPERM" && code !== "EBUSY" && code !== "EACCES") throw err;
      lastErr = err;
      await new Promise((r) => setTimeout(r, 25 * (attempt + 1)));
    }
  }
  throw lastErr;
}

export class FsStore implements ObjectStore {
  readonly kind = "fs" as const;
  private readonly root: string;

  constructor(root: string) {
    if (process.env.VERCEL) {
      throw new Error("fs store refused on Vercel: filesystem is ephemeral");
    }
    this.root = path.resolve(root);
  }

  private resolve(key: string): string {
    assertSafeKey(key);
    const full = path.resolve(this.root, ...key.split("/"));
    const rel = path.relative(this.root, full);
    if (rel.startsWith("..") || path.isAbsolute(rel)) throw new Error("unsafe object key");
    return full;
  }

  async ping(): Promise<void> {
    await fs.mkdir(this.root, { recursive: true, mode: DIR_MODE });
    await fs.access(this.root, fs.constants.W_OK | fs.constants.R_OK);
  }

  async put(key: string, bytes: Buffer): Promise<void> {
    const full = this.resolve(key);
    const dir = path.dirname(full);
    await fs.mkdir(dir, { recursive: true, mode: DIR_MODE });
    const tmp = path.join(dir, `.${path.basename(full)}.${randomBytes(6).toString("hex")}.tmp`);
    const handle = await fs.open(tmp, "wx", FILE_MODE);
    try {
      await handle.writeFile(bytes);
      await handle.sync();
    } finally {
      await handle.close();
    }
    try {
      await renameWithRetry(tmp, full);
    } catch (err) {
      await fs.rm(tmp, { force: true }).catch(() => undefined);
      throw err;
    }
  }

  async get(key: string): Promise<Buffer | null> {
    const full = this.resolve(key);
    try {
      return await fs.readFile(full);
    } catch (err) {
      if (isEnoent(err)) return null;
      throw err;
    }
  }

  async exists(key: string): Promise<boolean> {
    const full = this.resolve(key);
    try {
      const st = await fs.stat(full);
      return st.isFile();
    } catch (err) {
      if (isEnoent(err)) return false;
      throw err;
    }
  }

  async del(key: string): Promise<void> {
    const full = this.resolve(key);
    try {
      await fs.unlink(full);
    } catch (err) {
      if (!isEnoent(err)) throw err;
    }
    await this.pruneEmptyParents(path.dirname(full));
  }

  async list(prefix: string): Promise<string[]> {
    if (prefix !== "") assertSafeKey(prefix.endsWith("/") ? prefix.slice(0, -1) : prefix);
    // Start the walk at the deepest directory the prefix fully names.
    const slash = prefix.lastIndexOf("/");
    const startRel = slash === -1 ? "" : prefix.slice(0, slash);
    const startDir = startRel === "" ? this.root : path.resolve(this.root, ...startRel.split("/"));
    const out: string[] = [];
    await this.walk(startDir, out);
    return out.filter((k) => k.startsWith(prefix)).sort();
  }

  private async walk(dir: string, out: string[]): Promise<void> {
    let entries: import("node:fs").Dirent[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (err) {
      if (isEnoent(err)) return;
      throw err;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        await this.walk(full, out);
      } else if (e.isFile() && !e.name.endsWith(".tmp")) {
        out.push(path.relative(this.root, full).split(path.sep).join("/"));
      }
    }
  }

  private async pruneEmptyParents(dir: string): Promise<void> {
    let current = dir;
    for (let i = 0; i < 8; i += 1) {
      if (current === this.root || !current.startsWith(this.root)) return;
      try {
        await fs.rmdir(current);
      } catch {
        return;
      }
      current = path.dirname(current);
    }
  }
}

function isEnoent(err: unknown): boolean {
  return !!err && typeof err === "object" && (err as { code?: string }).code === "ENOENT";
}
