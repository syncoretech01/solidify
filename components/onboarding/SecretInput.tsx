"use client";

import { useState, type InputHTMLAttributes, type Ref } from "react";
import clsx from "clsx";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Field, describedBy } from "@/components/forms/Field";

/**
 * A masked numeric secret (EIN, account number). Always `type="text"` —
 * never `type="password"`, which invites credential managers and drops the
 * numeric keyboard. Masking is CSS (`.is-masked`); a Show/Hide toggle
 * reveals it on demand. Digits only ever leave the browser.
 */
export function SecretInput({
  id,
  label,
  error,
  note,
  disabled,
  registration,
  className,
  ref,
  ...input
}: {
  id: string;
  label: string;
  error?: string;
  note?: string;
  disabled?: boolean;
  registration: UseFormRegisterReturn;
  className?: string;
  ref?: Ref<HTMLInputElement>;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type" | "disabled" | "className" | "inputMode" | "autoComplete">) {
  const [shown, setShown] = useState(false);
  return (
    <Field id={id} label={label} error={error} note={note} className={className}>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-1p-ignore=""
          data-lpignore="true"
          className={clsx("input pr-[5.25rem]", !shown && "is-masked")}
          aria-invalid={!!error}
          aria-describedby={describedBy(id, error, note)}
          disabled={disabled}
          {...input}
          {...registration}
          ref={ref ?? registration.ref}
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-pressed={shown}
          aria-label={`${shown ? "Hide" : "Show"} ${label}`}
          aria-controls={id}
          disabled={disabled}
          className="absolute right-2 top-1/2 inline-flex h-[34px] -translate-y-1/2 items-center rounded-[var(--radius-btn)] border border-[var(--line-strong)] px-3 text-[var(--step--2)] font-semibold text-[var(--text-mid)] transition-colors hover:border-[var(--color-signal-400)] hover:text-[var(--text-hi)] disabled:opacity-45"
        >
          {shown ? "Hide" : "Show"}
        </button>
      </div>
    </Field>
  );
}
