/**
 * Onboarding record layer on top of the object store.
 *
 * Layout (every object is an AES-256-GCM envelope; AAD in brackets):
 *   onboarding/<id>/created.json.enc            [<id>:created]
 *   onboarding/<id>/steps/<step>.json.enc       [<id>:<step>]
 *   onboarding/<id>/files/<fileId>.bin.enc      [<id>:<fileId>]
 *   onboarding/<id>/files/<fileId>.meta.enc     [<id>:<fileId>:meta]
 *   onboarding/<id>/complete.json.enc           [<id>:complete]
 *
 * Secrets (ein, routingNumber, accountNumber) are stored digits-only, and
 * `maskRecord` is the only thing the default reviewer view ever sees.
 */

import { ONBOARDING_STEPS, SECRET_FIELDS, type OnboardingStep } from "@/lib/schemas";
import { newId, openBytes, openJson, sealBytes, sealJson } from "./crypto";
import { AppError } from "./errors";
import { getStore } from "./store";

export const UPLOAD_PURPOSES = ["certificate", "w9", "voided-check"] as const;
export type UploadPurpose = (typeof UPLOAD_PURPOSES)[number];

/** Which upload purpose a step's file field(s) must reference. */
export const STEP_FILE_PURPOSE: Partial<Record<OnboardingStep, UploadPurpose>> = {
  insurance: "certificate",
  w9: "w9",
  "direct-deposit": "voided-check",
};

/** 3 certificates + W-9 + voided check, with room for re-uploads. */
export const MAX_FILES_PER_SUBMISSION = 12;
export const MAX_ORIGINAL_NAME = 180;

const ID_RE = /^[A-Za-z0-9_-]{16,64}$/;

export function isSafeId(id: unknown): id is string {
  return typeof id === "string" && ID_RE.test(id);
}

export function assertSafeId(id: string): void {
  if (!isSafeId(id)) throw new AppError("not_found", "Unknown submission.");
}

function isStep(x: string): x is OnboardingStep {
  return (ONBOARDING_STEPS as readonly string[]).includes(x);
}

const keys = {
  root: (id: string) => `onboarding/${id}/`,
  created: (id: string) => `onboarding/${id}/created.json.enc`,
  stepsPrefix: (id: string) => `onboarding/${id}/steps/`,
  step: (id: string, step: OnboardingStep) => `onboarding/${id}/steps/${step}.json.enc`,
  filesPrefix: (id: string) => `onboarding/${id}/files/`,
  fileBin: (id: string, fileId: string) => `onboarding/${id}/files/${fileId}.bin.enc`,
  fileMeta: (id: string, fileId: string) => `onboarding/${id}/files/${fileId}.meta.enc`,
  complete: (id: string) => `onboarding/${id}/complete.json.enc`,
};

const aad = {
  created: (id: string) => `${id}:created`,
  step: (id: string, step: OnboardingStep) => `${id}:${step}`,
  file: (id: string, fileId: string) => `${id}:${fileId}`,
  fileMeta: (id: string, fileId: string) => `${id}:${fileId}:meta`,
  complete: (id: string) => `${id}:complete`,
};

export type StepPayload = Record<string, unknown>;

export interface CreatedRecord {
  createdAt: string;
}
export interface StepRecord {
  step: OnboardingStep;
  savedAt: string;
  payload: StepPayload;
}
export interface UploadMeta {
  fileId: string;
  purpose: UploadPurpose;
  originalName: string;
  mime: string;
  bytes: number;
  uploadedAt: string;
}
export interface CompleteRecord {
  completedAt: string;
  steps: OnboardingStep[];
}
export interface SubmissionRecord {
  submissionId: string;
  createdAt: string | null;
  complete: boolean;
  completedAt: string | null;
  masked: boolean;
  steps: Partial<Record<OnboardingStep, { savedAt: string; payload: StepPayload }>>;
  files: UploadMeta[];
}

/* ── submissions ─────────────────────────────────────────────────────────── */

export async function createSubmission(): Promise<string> {
  const store = await getStore();
  const id = newId(18);
  const record: CreatedRecord = { createdAt: new Date().toISOString() };
  await store.put(keys.created(id), sealJson(record, aad.created(id)));
  return id;
}

export async function exists(id: string): Promise<boolean> {
  assertSafeId(id);
  const store = await getStore();
  return store.exists(keys.created(id));
}

export async function getCreated(id: string): Promise<CreatedRecord | null> {
  assertSafeId(id);
  const store = await getStore();
  const bytes = await store.get(keys.created(id));
  return bytes ? openJson<CreatedRecord>(bytes, aad.created(id)) : null;
}

/* ── steps ───────────────────────────────────────────────────────────────── */

const digitsOnly = (v: unknown) => String(v ?? "").replace(/\D/g, "");

/** Secret fields become digits-only strings. Everything else passes through. */
export function normaliseSecrets(payload: StepPayload): StepPayload {
  const out: StepPayload = { ...payload };
  for (const key of SECRET_FIELDS) {
    if (key in out && out[key] !== undefined && out[key] !== null) out[key] = digitsOnly(out[key]);
  }
  return out;
}

/** Secret fields become "•••• " + last four digits. For the default reviewer view. */
export function maskRecord(payload: StepPayload): StepPayload {
  const out: StepPayload = { ...payload };
  for (const key of SECRET_FIELDS) {
    if (key in out && out[key] !== undefined && out[key] !== null) {
      const d = digitsOnly(out[key]);
      out[key] = `•••• ${d.slice(-4)}`;
    }
  }
  return out;
}

export async function putStep(id: string, step: OnboardingStep, payload: StepPayload): Promise<StepRecord> {
  assertSafeId(id);
  if (!isStep(step)) throw new AppError("validation_failed", "Unknown step.", { fields: { step: "Unknown step." } });
  const store = await getStore();
  const record: StepRecord = { step, savedAt: new Date().toISOString(), payload: normaliseSecrets(payload) };
  await store.put(keys.step(id, step), sealJson(record, aad.step(id, step)));
  return record;
}

export async function getStep(id: string, step: OnboardingStep): Promise<StepRecord | null> {
  assertSafeId(id);
  const store = await getStore();
  const bytes = await store.get(keys.step(id, step));
  return bytes ? openJson<StepRecord>(bytes, aad.step(id, step)) : null;
}

/** Steps saved so far, in canonical order. Never includes "complete". */
export async function listSteps(id: string): Promise<OnboardingStep[]> {
  assertSafeId(id);
  const store = await getStore();
  const prefix = keys.stepsPrefix(id);
  const found = new Set<string>();
  for (const key of await store.list(prefix)) {
    const m = /^([a-z0-9-]+)\.json\.enc$/.exec(key.slice(prefix.length));
    if (m?.[1]) found.add(m[1]);
  }
  return ONBOARDING_STEPS.filter((s) => found.has(s));
}

/* ── uploads ─────────────────────────────────────────────────────────────── */

export interface IncomingFile {
  buffer: Buffer;
  name: string;
  mime: string;
  size: number;
}

function cleanName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  // eslint-disable-next-line no-control-regex
  const cleaned = base.replace(/[\u0000-\u001f\u007f"<>]/g, "").trim();
  const safe = cleaned === "" || cleaned === "." || cleaned === ".." ? "upload" : cleaned;
  return safe.slice(0, MAX_ORIGINAL_NAME);
}

export async function putUpload(id: string, purpose: UploadPurpose, file: IncomingFile): Promise<UploadMeta> {
  assertSafeId(id);
  if (!(UPLOAD_PURPOSES as readonly string[]).includes(purpose)) {
    throw new AppError("validation_failed", "Unknown upload purpose.", { fields: { purpose: "Select what this file is." } });
  }
  const store = await getStore();
  const fileId = newId(12);
  const meta: UploadMeta = {
    fileId,
    purpose,
    originalName: cleanName(file.name),
    mime: file.mime,
    bytes: file.buffer.length,
    uploadedAt: new Date().toISOString(),
  };
  // Bytes first, then meta: a meta object is the signal that the blob is whole.
  await store.put(keys.fileBin(id, fileId), sealBytes(file.buffer, aad.file(id, fileId)));
  await store.put(keys.fileMeta(id, fileId), sealJson(meta, aad.fileMeta(id, fileId)));
  return meta;
}

export async function getUploadMeta(id: string, fileId: string): Promise<UploadMeta | null> {
  assertSafeId(id);
  if (!isSafeId(fileId)) return null;
  const store = await getStore();
  const bytes = await store.get(keys.fileMeta(id, fileId));
  return bytes ? openJson<UploadMeta>(bytes, aad.fileMeta(id, fileId)) : null;
}

export async function getUploadBytes(id: string, fileId: string): Promise<Buffer | null> {
  assertSafeId(id);
  if (!isSafeId(fileId)) return null;
  const store = await getStore();
  const bytes = await store.get(keys.fileBin(id, fileId));
  return bytes ? openBytes(bytes, aad.file(id, fileId)) : null;
}

export async function listUploadIds(id: string): Promise<string[]> {
  assertSafeId(id);
  const store = await getStore();
  const prefix = keys.filesPrefix(id);
  const ids: string[] = [];
  for (const key of await store.list(prefix)) {
    const m = /^([A-Za-z0-9_-]{16,64})\.meta\.enc$/.exec(key.slice(prefix.length));
    if (m?.[1]) ids.push(m[1]);
  }
  return ids;
}

export async function listUploads(id: string): Promise<UploadMeta[]> {
  const metas: UploadMeta[] = [];
  for (const fileId of await listUploadIds(id)) {
    const meta = await getUploadMeta(id, fileId);
    if (meta) metas.push(meta);
  }
  return metas.sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt));
}

export async function countUploads(id: string): Promise<number> {
  return (await listUploadIds(id)).length;
}

/* ── completion ──────────────────────────────────────────────────────────── */

export async function finalize(id: string, summary: CompleteRecord): Promise<void> {
  assertSafeId(id);
  const store = await getStore();
  await store.put(keys.complete(id), sealJson(summary, aad.complete(id)));
}

export async function getComplete(id: string): Promise<CompleteRecord | null> {
  assertSafeId(id);
  const store = await getStore();
  const bytes = await store.get(keys.complete(id));
  return bytes ? openJson<CompleteRecord>(bytes, aad.complete(id)) : null;
}

export async function isComplete(id: string): Promise<boolean> {
  assertSafeId(id);
  const store = await getStore();
  return store.exists(keys.complete(id));
}

/* ── deletion / retention ────────────────────────────────────────────────── */

/** Deletes every object under the submission. Returns how many were removed. */
export async function deleteSubmission(id: string): Promise<number> {
  assertSafeId(id);
  const store = await getStore();
  const all = await store.list(keys.root(id));
  // Marker last, so a half-finished delete still shows up in listSubmissions
  // and gets swept again by the next purge.
  const marker = keys.created(id);
  const ordered = [...all.filter((k) => k !== marker), ...all.filter((k) => k === marker)];
  for (const key of ordered) await store.del(key);
  return ordered.length;
}

export async function listSubmissions(): Promise<string[]> {
  const store = await getStore();
  const ids = new Set<string>();
  for (const key of await store.list("onboarding/")) {
    const seg = key.split("/")[1];
    if (seg && isSafeId(seg)) ids.add(seg);
  }
  return [...ids].sort();
}

export interface PurgeResult {
  deleted: string[];
  kept: number;
  errors: number;
}

/**
 * Removes submissions whose anchor time is older than `days`.
 * Anchor = complete.completedAt when finished, else created.createdAt.
 * A submission whose records cannot be read is counted as an error and left
 * in place; it is never deleted on a guess.
 */
export async function purgeOlderThan(days: number): Promise<PurgeResult> {
  const cutoff = Date.now() - Math.max(1, days) * 24 * 60 * 60 * 1000;
  const result: PurgeResult = { deleted: [], kept: 0, errors: 0 };
  for (const id of await listSubmissions()) {
    try {
      const complete = await getComplete(id);
      const anchor = complete?.completedAt ?? (await getCreated(id))?.createdAt ?? null;
      if (anchor === null) {
        // Orphaned objects without a created marker: treat as stale.
        await deleteSubmission(id);
        result.deleted.push(id);
        continue;
      }
      const t = Date.parse(anchor);
      if (!Number.isFinite(t)) {
        result.errors += 1;
        continue;
      }
      if (t < cutoff) {
        await deleteSubmission(id);
        result.deleted.push(id);
      } else {
        result.kept += 1;
      }
    } catch {
      result.errors += 1;
    }
  }
  return result;
}

/* ── reviewer read-back ──────────────────────────────────────────────────── */

export async function getSubmissionRecord(id: string, opts: { reveal: boolean }): Promise<SubmissionRecord | null> {
  assertSafeId(id);
  const created = await getCreated(id);
  if (!created) return null;
  const complete = await getComplete(id);
  const steps: SubmissionRecord["steps"] = {};
  for (const step of await listSteps(id)) {
    const rec = await getStep(id, step);
    if (!rec) continue;
    steps[step] = { savedAt: rec.savedAt, payload: opts.reveal ? rec.payload : maskRecord(rec.payload) };
  }
  return {
    submissionId: id,
    createdAt: created.createdAt,
    complete: complete !== null,
    completedAt: complete?.completedAt ?? null,
    masked: !opts.reveal,
    steps,
    files: await listUploads(id),
  };
}
