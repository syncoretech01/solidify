"use client";

import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { US_STATES, STATE_NAMES } from "@/lib/schemas";
import { Field, describedBy } from "@/components/forms/Field";

type Common = {
  id: string;
  label: string;
  error?: string;
  note?: string;
  optional?: boolean;
  disabled?: boolean;
  registration: UseFormRegisterReturn;
  className?: string;
};

/** Label + `.input`, registered. Extra input attributes pass straight through. */
export function TextField({
  id,
  label,
  error,
  note,
  optional,
  disabled,
  registration,
  className,
  ...input
}: Common & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "disabled" | "className">) {
  return (
    <Field id={id} label={label} error={error} note={note} optional={optional} className={className}>
      <input
        id={id}
        className="input"
        type="text"
        aria-invalid={!!error}
        aria-describedby={describedBy(id, error, note)}
        disabled={disabled}
        {...input}
        {...registration}
      />
    </Field>
  );
}

export function TextAreaField({
  id,
  label,
  error,
  note,
  optional,
  disabled,
  registration,
  className,
  ...textarea
}: Common & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "disabled" | "className">) {
  return (
    <Field id={id} label={label} error={error} note={note} optional={optional} className={className}>
      <textarea
        id={id}
        className="textarea"
        rows={3}
        aria-invalid={!!error}
        aria-describedby={describedBy(id, error, note)}
        disabled={disabled}
        {...textarea}
        {...registration}
      />
    </Field>
  );
}

const STATE_OPTIONS = US_STATES.map((s) => (
  <option key={s} value={s}>
    {STATE_NAMES[s]}
  </option>
));

export function StateSelect({ id, label, error, note, optional, disabled, registration, className, autoComplete }: Common & { autoComplete?: string }) {
  return (
    <Field id={id} label={label} error={error} note={note} optional={optional} className={className}>
      <select
        id={id}
        className="select"
        aria-invalid={!!error}
        aria-describedby={describedBy(id, error, note)}
        disabled={disabled}
        autoComplete={autoComplete}
        {...registration}
      >
        {/* An optional select must let the user go back to blank. */}
        <option value="" disabled={!optional}>
          {optional ? "None" : "Select state"}
        </option>
        {STATE_OPTIONS}
      </select>
    </Field>
  );
}

/** A single checkbox with its own label text; the error sits below it. */
export function CheckField({
  id,
  children,
  error,
  disabled,
  registration,
  className,
}: {
  id: string;
  children: ReactNode;
  error?: string;
  disabled?: boolean;
  registration: UseFormRegisterReturn;
  className?: string;
}) {
  return (
    <div className={className ? `field ${className}` : "field"} data-field={id}>
      <label className="checkbox" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          disabled={disabled}
          {...registration}
        />
        <span>{children}</span>
      </label>
      {error && (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** A group heading inside a step. */
export function Group({ legend, children, columns = 2 }: { legend: string; children: ReactNode; columns?: 2 | 3 }) {
  return (
    <fieldset className={`grid gap-4 ${columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
      <legend className="label mb-3">{legend}</legend>
      {children}
    </fieldset>
  );
}
