/**
 * S3-compatible object store (AWS S3, Cloudflare R2, Backblaze B2, MinIO).
 *
 * When S3_ENDPOINT is set the client uses path-style addressing, which is
 * what every non-AWS provider expects. Objects are already encrypted by
 * the caller; enable bucket-level default encryption as well if the
 * provider offers it, but nothing here depends on it.
 */

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { S3Settings } from "../config";
import { assertSafeKey, type ObjectStore } from "./index";

export class S3Store implements ObjectStore {
  readonly kind = "s3" as const;
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly prefix: string;

  constructor(settings: S3Settings) {
    this.bucket = settings.bucket;
    this.prefix = settings.prefix ? `${settings.prefix}/` : "";
    this.client = new S3Client({
      region: settings.region,
      ...(settings.endpoint ? { endpoint: settings.endpoint, forcePathStyle: true } : {}),
      credentials: { accessKeyId: settings.accessKeyId, secretAccessKey: settings.secretAccessKey },
    });
  }

  private k(key: string): string {
    assertSafeKey(key);
    return `${this.prefix}${key}`;
  }

  async ping(): Promise<void> {
    await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
  }

  async put(key: string, bytes: Buffer): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.k(key),
        Body: bytes,
        ContentType: "application/octet-stream",
        CacheControl: "no-store",
      }),
    );
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: this.k(key) }));
      if (!res.Body) return null;
      const bytes = await res.Body.transformToByteArray();
      return Buffer.from(bytes);
    } catch (err) {
      if (isNotFound(err)) return null;
      throw err;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: this.k(key) }));
      return true;
    } catch (err) {
      if (isNotFound(err)) return false;
      throw err;
    }
  }

  async del(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: this.k(key) }));
  }

  async list(prefix: string): Promise<string[]> {
    if (prefix !== "") assertSafeKey(prefix.endsWith("/") ? prefix.slice(0, -1) : prefix);
    const full = `${this.prefix}${prefix}`;
    const out: string[] = [];
    let token: string | undefined;
    do {
      const res = await this.client.send(
        new ListObjectsV2Command({ Bucket: this.bucket, Prefix: full, ContinuationToken: token, MaxKeys: 1000 }),
      );
      for (const obj of res.Contents ?? []) {
        if (obj.Key && obj.Key.startsWith(this.prefix)) out.push(obj.Key.slice(this.prefix.length));
      }
      token = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (token);
    return out.sort();
  }
}

function isNotFound(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
  return e.name === "NoSuchKey" || e.name === "NotFound" || e.$metadata?.httpStatusCode === 404;
}
