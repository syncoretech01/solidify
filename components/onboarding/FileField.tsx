"use client";

import { useEffect, useRef, useState, type DragEvent, type ChangeEvent, type Ref } from "react";
import clsx from "clsx";
import { uploadFile, type Result, type UploadPurpose } from "@/lib/onboarding-client";
import { Field } from "@/components/forms/Field";
import { ACCEPT, MAX_UPLOAD_BYTES, TOO_LARGE, WRONG_TYPE, formatBytes, type UploadedFile } from "./types";

const OK_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const OK_EXT = /\.(pdf|jpe?g|png)$/i;

/** Client-side pre-checks. The server still sniffs the bytes. */
export function checkFile(file: File): string | null {
  if (file.size === 0) return "That file is empty.";
  if (file.size > MAX_UPLOAD_BYTES) return TOO_LARGE;
  if (!OK_TYPES.has(file.type) && !OK_EXT.test(file.name)) return WRONG_TYPE;
  return null;
}

interface Pending {
  key: number;
  name: string;
  bytes: number;
}

/**
 * Click-to-choose + drag-and-drop. Every selected file uploads immediately
 * through `uploadFile`; the form field holds the returned fileId(s). A failed
 * upload shows inline and never disturbs files already stored.
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
    for (const file of picked) {
      if (space <= 0) break;
      const problem = checkFile(file);
      if (problem) {
        setLocalError(problem);
        continue;
      }
      space -= 1;
      const key = ++keyRef.current;
      setPending((p) => [...p, { key, name: file.name, bytes: file.size }]);
      const result = await uploadFile(purpose, file);
      if (!mounted.current) return;
      setPending((p) => p.filter((x) => x.key !== key));
      if (result.ok && result.data) {
        const meta: UploadedFile = { fileId: result.data.fileId, name: result.data.name, bytes: result.data.bytes, purpose: result.data.purpose };
        onUploaded(meta);
        const next = [...idsRef.current, meta.fileId];
        idsRef.current = next;
        onIdsChange(next);
        continue;
      }
      space += 1;
      if (result.kind === "invalid") setLocalError(result.fields?.file ?? result.message ?? WRONG_TYPE);
      else if (result.kind === "too_large") setLocalError(result.message ?? TOO_LARGE);
      else if (result.kind === "failed" || result.kind === "offline") setLocalError(result.message ?? "That upload did not complete. Nothing was stored — please try again.");
      else onOutcome(result);
      if (result.kind === "no_session" || result.kind === "not_configured") return;
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
