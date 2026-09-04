"use client";

import { useEffect, useRef, useState, type DragEvent, type ChangeEvent, type Ref } from "react";
import clsx from "clsx";
import { type Result, type UploadPurpose } from "@/lib/onboarding-client";
import { downscaleIfImage } from "@/lib/image-downscale";
import { Field } from "@/components/forms/Field";
import { ACCEPT, MAX_TOTAL_UPLOAD_BYTES, MAX_UPLOAD_BYTES, TOO_LARGE, WRONG_TYPE, formatBytes, newFileId, type UploadedFile } from "./types";

const OK_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const OK_EXT = /\.(pdf|jpe?g|png)$/i;

/**
 * Client-side pre-checks. The server still sniffs the bytes, and enforces the
 * same two budgets — this exists so the applicant learns about a file that is
 * too big at the moment they pick it, not ninety seconds into a submit.
 */
export function checkFile(file: File, usedBytes = 0): string | null {
  if (file.size === 0) return "That file is empty.";
  if (!OK_TYPES.has(file.type) && !OK_EXT.test(file.name)) return WRONG_TYPE;
  if (file.size > MAX_UPLOAD_BYTES) {
    return file.type === "application/pdf"
      ? `${file.name} is ${formatBytes(file.size)}. ${TOO_LARGE} PDFs cannot be reduced in your browser — re-scan it in black and white or at 150 dpi, then try again. If you cannot, call (510) 499-4552 and we will take it another way.`
      : `${file.name} is ${formatBytes(file.size)} after being reduced. ${TOO_LARGE} Take the photo again in better light and closer to the document.`;
  }
  if (usedBytes + file.size > MAX_TOTAL_UPLOAD_BYTES) {
    return `Your documents would total ${formatBytes(usedBytes + file.size)}. One submission can carry ${formatBytes(MAX_TOTAL_UPLOAD_BYTES)}. Remove or replace the largest before adding this one.`;
  }
  return null;
}

interface Pending {
  key: number;
  name: string;
  bytes: number;
}

/**
 * Click-to-choose + drag-and-drop.
 *
 * Nothing is uploaded here. The file is decoded, reduced if it is an oversized
 * image, and held in memory with a client-minted id; the form field holds that
 * id. Everything travels in one request when the application is submitted,
 * because this site keeps no record and so has nowhere to put a file early.
 */
export function FileField({
  id,
  label,
  purpose,
  max,
  ids,
  onIdsChange,
  files,
  onUploaded,
  onOutcome,
  disabled,
  error,
  note,
  inputRef,
}: {
  id: string;
  label: string;
  purpose: UploadPurpose;
  max: number;
  ids: string[];
  onIdsChange: (ids: string[]) => void;
  files: Record<string, UploadedFile>;
  onUploaded: (file: UploadedFile) => void;
  onOutcome: (result: Result) => void;
  disabled?: boolean;
  error?: string;
  note?: string;
  inputRef?: Ref<HTMLInputElement>;
}) {
  const [pending, setPending] = useState<Pending[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const nativeRef = useRef<HTMLInputElement | null>(null);
  const idsRef = useRef(ids);
  idsRef.current = ids;
  const usedBytesRef = useRef(0);
  usedBytesRef.current = Object.values(files).reduce((n, x) => n + x.bytes, 0);
  const keyRef = useRef(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const setRefs = (el: HTMLInputElement | null) => {
    nativeRef.current = el;
    if (typeof inputRef === "function") inputRef(el);
    else if (inputRef && "current" in inputRef) (inputRef as { current: HTMLInputElement | null }).current = el;
  };

  const room = max - ids.length - pending.length;
  const full = room <= 0;
  const multiple = max > 1;

  async function accept(list: FileList | File[]) {
    if (disabled) return;
    const picked = Array.from(list);
    if (picked.length === 0) return;
    let space = max - idsRef.current.length - pending.length;
    setLocalError(null);
    if (picked.length > space) {
      setLocalError(multiple ? `You can upload up to ${max} files here.` : "Only one file can be uploaded here. Remove the current file first.");
    }
    for (const original of picked) {
      if (space <= 0) break;
      space -= 1;
      const key = ++keyRef.current;
      setPending((p) => [...p, { key, name: original.name, bytes: original.size }]);

      const { file, originalBytes, reduced } = await downscaleIfImage(original);
      if (!mounted.current) return;
      setPending((p) => p.filter((x) => x.key !== key));

      const problem = checkFile(file, usedBytesRef.current);
      if (problem) {
        setLocalError(problem);
        space += 1;
        continue;
      }

      const meta: UploadedFile = {
        fileId: newFileId(),
        name: file.name,
        bytes: file.size,
        originalBytes,
        reduced,
        mime: file.type,
        purpose,
        blob: file,
      };
      onUploaded(meta);
      const next = [...idsRef.current, meta.fileId];
      idsRef.current = next;
      onIdsChange(next);
    }
  }

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (list) void accept(list);
    e.target.value = "";
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (disabled || full) return;
    void accept(e.dataTransfer.files);
  };

  const remove = (fileId: string) => {
    const next = idsRef.current.filter((x) => x !== fileId);
    idsRef.current = next;
    onIdsChange(next);
    setLocalError(null);
  };

  const shownError = error ?? localError ?? undefined;
  const describe = [note ? `${id}-note` : null, shownError ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;

  return (
    <Field id={id} label={label} error={shownError} note={note}>
      <div
        data-dropzone
        data-dragging={dragging || undefined}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !full) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={clsx(
          "grid gap-3 rounded-[var(--radius-btn)] border border-dashed p-4 transition-colors",
          "bg-[color-mix(in_srgb,var(--surface-sunken)_55%,transparent)] focus-within:border-[var(--color-signal-400)] focus-within:shadow-[0_0_0_3px_rgba(47,107,255,0.22)]",
          dragging ? "border-[var(--color-signal-400)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]" : "border-[var(--line-strong)]",
          shownError && "border-[var(--color-error)]",
          disabled && "opacity-60",
        )}
      >
        <input
          ref={setRefs}
          id={id}
          type="file"
          className="sr-only"
          accept={ACCEPT}
          multiple={multiple}
          onChange={onChange}
          disabled={disabled || full}
          aria-invalid={!!shownError}
          aria-describedby={describe}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => nativeRef.current?.click()}
            disabled={disabled || full}
            className="btn btn-ghost !min-h-[42px] !px-4"
          >
            {multiple ? "Choose files" : "Choose file"}
          </button>
          <span className="text-[var(--step--1)] text-[var(--text-mid)]">
            {full ? (multiple ? `${max} of ${max} uploaded.` : "Uploaded. Remove it to replace.") : "or drag and drop here"}
            {!full && multiple && (
              <span className="text-[var(--text-low)]">
                {" "}
                · {ids.length + pending.length} of {max}
              </span>
            )}
          </span>
        </div>

        {(ids.length > 0 || pending.length > 0) && (
          <ul className="grid gap-2" aria-label={`Uploaded ${label}`}>
            {ids.map((fileId) => {
              const f = files[fileId];
              return (
                <li key={fileId} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-btn)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2" data-file-id={fileId}>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[var(--step--1)] font-medium text-[var(--text-hi)]">{f?.name ?? "Stored file"}</span>
                    <span className="numeral block text-[var(--step--2)] text-[var(--text-low)]">
                      {f ? `${formatBytes(f.bytes)} · ` : ""}
                      stored as {fileId}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(fileId)}
                    disabled={disabled}
                    className="inline-flex h-[34px] items-center rounded-[var(--radius-btn)] border border-[var(--line-strong)] px-3 text-[var(--step--2)] font-semibold text-[var(--text-mid)] transition-colors hover:border-[var(--color-error)] hover:text-[var(--text-hi)] disabled:opacity-45"
                    aria-label={`Remove ${f?.name ?? fileId}`}
                  >
                    Remove
                  </button>
                </li>
              );
            })}
            {pending.map((p) => (
              <li key={`pending-${p.key}`} className="flex items-center justify-between gap-3 rounded-[var(--radius-btn)] border border-[var(--line)] px-3 py-2" aria-busy="true">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[var(--step--1)] font-medium text-[var(--text-hi)]">{p.name}</span>
                  <span className="numeral block text-[var(--step--2)] text-[var(--text-low)]">{formatBytes(p.bytes)} · uploading…</span>
                </span>
                <span className="h-2 w-2 flex-none animate-pulse rounded-full bg-[var(--color-signal-400)]" aria-hidden />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Field>
  );
}
