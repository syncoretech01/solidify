"use client";

import type { FormEvent, ReactNode } from "react";
import { STEP_COUNT, STEP_META, stepNumber, type StepKey } from "./types";

/**
 * The frame every step shares: numbered heading (focus target on step
 * change), lead, body, and the Back / primary footer. It is the <form>, so
 * the primary button submits.
 */
export function StepShell({
  step,
  disabled,
  busy,
  onBack,
  onSubmit,
  submitLabel,
  busyLabel = "Saving…",
  children,
}: {
  step: StepKey;
  disabled: boolean;
  busy: boolean;
  onBack: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  busyLabel?: string;
  children: ReactNode;
}) {
  const n = stepNumber(step);
  const meta = STEP_META[step];
  const titleId = `onb-${step}-title`;
  return (
    <form
      data-onboarding-step={step}
      noValidate
      onSubmit={onSubmit}
      aria-labelledby={titleId}
      aria-busy={busy}
      className="card flex flex-col gap-7 bg-[var(--surface)] p-5 sm:p-6 lg:p-8"
    >
      <header className="flex flex-col gap-2 border-b border-[var(--line)] pb-5">
        <span className="label">
          Step {n} of {STEP_COUNT}
        </span>
        <h3 id={titleId} tabIndex={-1} className="title-sm scroll-mt-[calc(var(--nav-h)+1.5rem)]">
          {meta.title}
        </h3>
        <p className="small">{meta.lead}</p>
      </header>

      {children}

      <footer className="flex flex-col-reverse gap-3 border-t border-[var(--line)] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" className="btn btn-ghost" onClick={onBack} disabled={disabled || busy || n === 1}>
          Back
        </button>
        <button type="submit" className="btn btn-primary" disabled={disabled || busy}>
          {busy ? busyLabel : submitLabel}
        </button>
      </footer>
    </form>
  );
}
