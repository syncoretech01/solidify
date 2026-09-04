import { z } from "zod";
import { getConfig } from "@/lib/server/config";
import { requireCsrf } from "@/lib/server/csrf";
import { AppError } from "@/lib/server/errors";
import { fail, json, limit, requireConfigured, requireSession } from "@/lib/server/guards";
import { log } from "@/lib/server/log";
import { getMailer } from "@/lib/server/mail";
import { buildOnboardingEmail, type DeliveredFile, type OnboardingPayload } from "@/lib/server/onboarding-mail";
import { MAX_FILES_PER_SUBMISSION, MAX_ORIGINAL_NAME, UPLOAD_PURPOSES, cleanName, isSafeId, normaliseSecrets, type UploadPurpose } from "@/lib/server/onboarding";
import { detectMime, sniffUpload } from "@/lib/server/validate";
import { ONBOARDING_STEPS, STEP_SCHEMAS } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Posting up to 3.5 MB of attachments onward to the mail provider from a cold
// instance needs more than the default.
export const maxDuration = 60;

/** Refuse before reading a byte: 4 MiB leaves headroom under Vercel's 4.5 MB. */
const MAX_REQUEST_BYTES = 4 * 1024 * 1024;

const PART_RE = /^file\.(certificate|w9|voided-check)\.([A-Za-z0-9_-]{16,64})$/;

const payloadSchema = z.object({
  profile: STEP_SCHEMAS.profile,
  equipment: STEP_SCHEMAS.equipment,
  insurance: STEP_SCHEMAS.insurance,
  w9: STEP_SCHEMAS.w9,
  "direct-deposit": STEP_SCHEMAS["direct-deposit"],
});

/**
 * POST /api/onboarding/submit   multipart/form-data
 *
 *   data                       JSON of all five steps
 *   file.<purpose>.<id>        0–5 documents, purpose and id in the part name
 *
 *   200 { ok: true, reference, deliveredAt }
 *   4xx validation / gate failures — nothing is sent
 *   502 { error: "delivery_failed" } — the provider refused; nothing is kept
 *
 * The order below is the guarantee: every check runs BEFORE the send, so a
 * rejected submission never produces an email, and the only path to 200 is a
 * resolved delivery. Nothing is written to disk at any point.
 */
export async function POST(req: Request) {
  let buffers: Buffer[] = [];
  try {
    const cfgFail = requireConfigured();
    if (cfgFail) return cfgFail;
    const limited = await limit(req, "submit");
    if (limited) return limited;
    const csrfFail = requireCsrf(req);
    if (csrfFail) return csrfFail;
    const session = requireSession(req);
    if (session instanceof Response) return session;

    const declared = req.headers.get("content-length");
    if (declared !== null && Number(declared) > MAX_REQUEST_BYTES) throw new AppError("payload_too_large");

    const cfg = getConfig();
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      throw new AppError("bad_form");
    }

    /* ── the step data ──────────────────────────────────────────────────── */
    const raw = form.get("data");
    if (typeof raw !== "string") throw new AppError("bad_form");
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      throw new AppError("bad_json");
    }

    const missing = ONBOARDING_STEPS.filter((s) => {
      const v = (parsedJson as Record<string, unknown> | null)?.[s];
      return v === undefined || v === null;
    });
    if (missing.length > 0) throw new AppError("incomplete", "steps missing", { missing: [...missing] });

    const parsed = payloadSchema.safeParse(parsedJson);
    if (!parsed.success) return fail(parsed.error, "onboarding/submit");
    const payload = { ...parsed.data } as OnboardingPayload;
    payload["direct-deposit"] = normaliseSecrets(payload["direct-deposit"]) as OnboardingPayload["direct-deposit"];

    /* ── the documents ──────────────────────────────────────────────────── */
    const files: DeliveredFile[] = [];
    let total = 0;
    for (const [name, value] of form.entries()) {
      if (name === "data") continue;
      const m = PART_RE.exec(name);
      if (!m || typeof value === "string") throw new AppError("validation_failed", "bad part", { fields: { documents: "Unexpected form part." } });
      const purpose = m[1] as UploadPurpose;
      const id = m[2];
      if (!isSafeId(id)) throw new AppError("validation_failed", "bad id", { fields: { documents: "Unexpected document reference." } });
      if (files.length >= MAX_FILES_PER_SUBMISSION) {
        throw new AppError("validation_failed", "too many files", { fields: { documents: `Attach at most ${MAX_FILES_PER_SUBMISSION} documents.` } });
      }

      const file = value as File;
      if (file.size > cfg.maxUploadBytes) throw new AppError("file_too_large");
      const buffer = Buffer.from(await file.arrayBuffer());
      buffers.push(buffer);
      total += buffer.length;
      if (buffer.length > cfg.maxUploadBytes) throw new AppError("file_too_large");
      if (total > cfg.maxTotalUploadBytes) throw new AppError("payload_too_large");

      const problem = sniffUpload(buffer, file.type, buffer.length, cfg.maxUploadBytes);
      if (problem) throw new AppError("validation_failed", "bad file", { fields: { documents: problem } });
      const mime = detectMime(buffer);
      if (!mime) throw new AppError("validation_failed", "bad file", { fields: { documents: "File must be a PDF, JPEG or PNG." } });

      files.push({ id, purpose, originalName: cleanName(file.name).slice(0, MAX_ORIGINAL_NAME), mime, bytes: buffer.length, buffer });
    }

    /* ── every reference resolves, and every part is referenced ─────────── */
    const referenced = new Map<string, UploadPurpose>();
    for (const cid of payload.insurance.certificateFileIds) referenced.set(cid, "certificate");
    referenced.set(payload.w9.w9FileId, "w9");
    referenced.set(payload["direct-deposit"].voidedCheckFileId, "voided-check");

    for (const [id, purpose] of referenced) {
      const hit = files.find((f) => f.id === id);
      if (!hit || hit.purpose !== purpose) {
        const field = purpose === "certificate" ? "insurance.certificateFileIds" : purpose === "w9" ? "w9.w9FileId" : "direct-deposit.voidedCheckFileId";
        throw new AppError("validation_failed", "missing document", { fields: { [field]: "That document was not attached to this submission." } });
      }
    }
    for (const f of files) {
      if (!referenced.has(f.id)) {
        throw new AppError("validation_failed", "unreferenced document", { fields: { documents: "A document was attached that no step refers to." } });
      }
    }
    for (const p of UPLOAD_PURPOSES) {
      if (!files.some((f) => f.purpose === p)) {
        const field = p === "certificate" ? "insurance.certificateFileIds" : p === "w9" ? "w9.w9FileId" : "direct-deposit.voidedCheckFileId";
        throw new AppError("validation_failed", "missing document", { fields: { [field]: "This document is required." } });
      }
    }

    /* ── build, then deliver. Nothing below is ever logged. ─────────────── */
    const mailer = getMailer();
    if (!mailer || !cfg.onboardingToEmail) throw new AppError("backend_not_configured");

    const reference = session.submissionId;
    const deliveredAt = new Date().toISOString();
    const mail = buildOnboardingEmail(payload, files, reference, deliveredAt);

    try {
      const { id } = await mailer.send({
        to: cfg.onboardingToEmail,
        subject: mail.subject,
        text: mail.text,
        replyTo: payload.profile.email,
        attachments: mail.attachments,
      });
      log.info("onboarding: delivered", { reference, steps: ONBOARDING_STEPS.length, attachments: mail.attachments.length, bytes: total, messageId: id });
    } catch (err) {
      log.error("onboarding: delivery refused by provider", err instanceof Error ? err.message : "unknown");
      throw new AppError("delivery_failed");
    }

    return json({ ok: true, reference, deliveredAt });
  } catch (err) {
    return fail(err, "onboarding/submit");
  } finally {
    // Release the document bytes with the invocation; instances are reused.
    buffers.forEach((b) => b.fill(0));
    buffers = [];
  }
}
