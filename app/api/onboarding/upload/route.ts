import { NextResponse } from "next/server";
import { z } from "zod";
import { getConfig } from "@/lib/server/config";
import { requireCsrf } from "@/lib/server/csrf";
import { AppError } from "@/lib/server/errors";
import { fail, json, limit, requireConfigured, requireSession } from "@/lib/server/guards";
import { log } from "@/lib/server/log";
import { MAX_FILES_PER_SUBMISSION, UPLOAD_PURPOSES, countUploads, isComplete, putUpload } from "@/lib/server/onboarding";
import { detectMime, sniffUpload } from "@/lib/server/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const purposeSchema = z.enum(UPLOAD_PURPOSES);
const HEADER_SLACK = 64 * 1024;

/**
 * POST /api/onboarding/upload  multipart: file, purpose ∈ certificate|w9|voided-check
 *   200 { ok: true, fileId, name, bytes, purpose }
 *   413 { error: "file_too_large", message }
 *   422 { error: "validation_failed", fields: { file | purpose } }
 * Content-Length is checked against the cap BEFORE the body is read; the
 * bytes are sniffed and must agree with the declared type.
 */
export async function POST(req: Request) {
  try {
    const cfgFail = requireConfigured();
    if (cfgFail) return cfgFail;
    const limited = await limit(req, "upload");
    if (limited) return limited;
    const csrfFail = requireCsrf(req);
    if (csrfFail) return csrfFail;
    const session = requireSession(req);
    if (session instanceof NextResponse) return session;
    const id = session.submissionId;

    const cfg = getConfig();
    const declared = Number(req.headers.get("content-length") ?? "");
    if (Number.isFinite(declared) && declared > cfg.maxUploadBytes + HEADER_SLACK) throw new AppError("file_too_large");

    if (await isComplete(id)) throw new AppError("already_complete");

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      throw new AppError("bad_form");
    }

    const purpose = purposeSchema.safeParse(form.get("purpose"));
    if (!purpose.success) {
      return json({ error: "validation_failed", fields: { purpose: "Select what this file is." } }, { status: 422 });
    }
    const file = form.get("file");
    if (!(file instanceof File)) {
      return json({ error: "validation_failed", fields: { file: "Choose a file to upload." } }, { status: 422 });
    }
    if (file.size > cfg.maxUploadBytes) throw new AppError("file_too_large");
    if (file.size === 0) {
      return json({ error: "validation_failed", fields: { file: "The file is empty." } }, { status: 422 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const problem = sniffUpload(buffer, file.type, buffer.length, cfg.maxUploadBytes);
    if (problem) {
      if (buffer.length > cfg.maxUploadBytes) throw new AppError("file_too_large");
      return json({ error: "validation_failed", fields: { file: problem } }, { status: 422 });
    }
    const mime = detectMime(buffer);
    if (!mime) return json({ error: "validation_failed", fields: { file: "File must be a PDF, JPEG or PNG." } }, { status: 422 });

    if ((await countUploads(id)) >= MAX_FILES_PER_SUBMISSION) {
      return json({ error: "validation_failed", fields: { file: "Too many files uploaded for this application." } }, { status: 422 });
    }

    const meta = await putUpload(id, purpose.data, { buffer, name: file.name, mime, size: buffer.length });
    log.info("onboarding: file stored", { submissionId: id, purpose: meta.purpose, bytes: meta.bytes });
    return json({ ok: true, fileId: meta.fileId, name: meta.originalName, bytes: meta.bytes, purpose: meta.purpose });
  } catch (err) {
    return fail(err, "onboarding/upload");
  }
}
