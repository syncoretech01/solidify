"use client";

import { useRef, type KeyboardEvent } from "react";
import clsx from "clsx";
import { ONBOARDING_STEPS, type OnboardingStep } from "@/lib/schemas";
import { STATUS_LABEL, STEP_META, STEP_ORDER, type StepKey, type StepStatus } from "./types";

type BadgeTone = "low" | "accent" | "warn" | "ok";

const BADGE_TONE: Record<BadgeTone, string> = {
  low: "border-[var(--line)] text-[var(--text-low)]",
  accent: "border-[color-mix(in_srgb,var(--color-signal-400)_45%,transparent)] text-[var(--color-signal-300)]",
  warn: "border-[color-mix(in_srgb,var(--color-warn)_45%,transparent)] text-[var(--color-warn)]",
  ok: "border-[color-mix(in_srgb,var(--color-success)_45%,transparent)] text-[var(--color-success)]",
};

function badgeFor(key: StepKey, status: Record<OnboardingStep, StepStatus>, done: boolean): { text: string; tone: BadgeTone } {
  if (key === "review") {
    if (done) return { text: "Submitted", tone: "ok" };
    const ready = ONBOARDING_STEPS.every((s) => status[s] === "saved");
    return ready ? { text: "Ready", tone: "accent" } : { text: "Pending", tone: "low" };
  }
  const s = status[key];
  const tone: BadgeTone = s === "saved" || s === "submitted" ? "ok" : s === "dirty" ? "warn" : s === "in-progress" ? "accent" : "low";
  return { text: STATUS_LABEL[s], tone };
}

const NAV_KEYS = new Set(["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"]);

/**
 * The step list. Buttons (so it is keyboard-operable as-is), arrow keys move
 * between them, `aria-current="step"` marks the active one. A horizontal
 * scroller on small screens, a vertical sticky column from `lg` up.
 */
export function StepRail({
  current,
  status,
  done,
  disabled,
  missing,
  onSelect,
}: {
  current: StepKey;
  status: Record<OnboardingStep, StepStatus>;
  done: boolean;
  disabled: boolean;
  missing: OnboardingStep[];
  onSelect: (step: StepKey) => void;
}) {
  const list = useRef<HTMLOListElement>(null);

  const onKeyDown = (e: KeyboardEvent<HTMLOListElement>) => {
    if (!NAV_KEYS.has(e.key)) return;
    const buttons = Array.from(list.current?.querySelectorAll<HTMLButtonElement>("button[data-step]") ?? []);
    const i = buttons.findIndex((b) => b === document.activeElement);
    if (i < 0 || buttons.length === 0) return;
    e.preventDefault();
    let next = i;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % buttons.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + buttons.length) % buttons.length;
    else if (e.key === "Home") next = 0;
    else next = buttons.length - 1;
    buttons[next]?.focus();
  };

  return (
    <nav aria-label="Onboarding steps" className="lg:sticky lg:top-[calc(var(--nav-h)+1.25rem)]">
      <ol ref={list} onKeyDown={onKeyDown} className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:thin] lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
        {STEP_ORDER.map((key, i) => {
          const active = key === current;
          const badge = badgeFor(key, status, done);
          const isMissing = key !== "review" && missing.includes(key);
          return (
            <li key={key} className="w-[13.5rem] flex-none snap-start lg:w-auto">
              <button
                type="button"
                data-step={key}
                data-state={key === "review" ? undefined : status[key]}
                aria-current={active ? "step" : undefined}
                onClick={() => onSelect(key)}
                disabled={disabled}
                className={clsx(
                  "flex w-full items-start gap-3 rounded-[var(--radius-btn)] border px-3.5 py-3 text-left transition-colors",
                  active
                    ? "border-[var(--color-signal-400)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]"
                    : "border-[var(--line)] bg-[color-mix(in_srgb,var(--surface-sunken)_45%,transparent)] hover:border-[var(--line-strong)]",
                  isMissing && !active && "border-[color-mix(in_srgb,var(--color-error)_55%,transparent)]",
                  "disabled:cursor-not-allowed disabled:opacity-45",
                )}
              >
                <span className={clsx("numeral mt-[3px] text-[var(--step--2)] tracking-[0.14em]", active ? "text-[var(--accent)]" : "text-[var(--text-low)]")}>{String(i + 1).padStart(2, "0")}</span>
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="text-[var(--step--1)] font-semibold leading-tight text-[var(--text-hi)]">{STEP_META[key].label}</span>
                  <span className={clsx("inline-flex w-fit items-center rounded-full border px-2 py-[2px] text-[var(--step--2)] leading-[1.3]", isMissing ? BADGE_TONE.warn : BADGE_TONE[badge.tone])}>
                    {badge.text}
                    {isMissing && <span className="sr-only">, required before submitting</span>}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
