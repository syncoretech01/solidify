"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

/** Label + control + note/error wiring. `error` sets aria-invalid and describedby. */
export function Field({
  id,
  label,
  note,
  error,
  children,
  className,
  optional = false,
}: {
  id: string;
  label: string;
  note?: string;
  error?: string;
  children: ReactNode;
  className?: string;
  optional?: boolean;
}) {
  return (
    <div className={clsx("field", className)} data-field={id}>
      <label htmlFor={id} className="field-label">
        {label}
        {optional && <span className="ml-2 font-normal text-[var(--text-low)]">Optional</span>}
      </label>
      {children}
      {note && !error && (
        <p id={`${id}-note`} className="field-note">
          {note}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export const describedBy = (id: string, error?: string, note?: string) =>
  error ? `${id}-error` : note ? `${id}-note` : undefined;
