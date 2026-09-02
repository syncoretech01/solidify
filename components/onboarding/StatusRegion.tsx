"use client";

import clsx from "clsx";
import type { Message, Tone } from "./types";

const TONE: Record<Tone, string> = {
  neutral: "border-[var(--line-strong)] bg-[color-mix(in_srgb,var(--surface-sunken)_55%,transparent)] text-[var(--text-mid)]",
  success: "border-[var(--color-success)]/50 bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] text-[var(--text-hi)]",
  warn: "border-[var(--color-warn)]/50 bg-[color-mix(in_srgb,var(--color-warn)_10%,transparent)] text-[var(--text-hi)]",
  error: "border-[var(--color-error)]/50 bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)] text-[var(--text-hi)]",
};

/**
 * The one place every backend outcome is written, in plain language. Always
 * in the DOM so assistive tech hears changes; visually empty when idle.
 */
export function StatusRegion({ message }: { message: Message | null }) {
  return (
    <div
      data-onboarding-status
      data-tone={message?.tone ?? "none"}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={clsx("rounded-md text-[var(--step--1)] leading-relaxed transition-colors", message && "border px-4 py-3", message && TONE[message.tone])}
    >
      {message?.text ?? ""}
    </div>
  );
}
