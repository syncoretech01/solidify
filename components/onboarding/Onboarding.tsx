"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { OnboardingStep } from "@/lib/schemas";
import { useOnboarding } from "./useOnboarding";
import { AccessGate } from "./AccessGate";
import { StatusRegion } from "./StatusRegion";
import { StepRail } from "./StepRail";
import { DonePanel } from "./DonePanel";
import { ReviewStep } from "./ReviewStep";
import { ProfileStep } from "./steps/ProfileStep";
import { EquipmentStep } from "./steps/EquipmentStep";
import { InsuranceStep } from "./steps/InsuranceStep";
import { W9Step } from "./steps/W9Step";
import { DirectDepositStep } from "./steps/DirectDepositStep";
import { BLANK, type StepForms, type StepHandlers } from "./types";

const TITLE = {
  booting: "Unlock onboarding",
  locked: "Onboarding is not open on this server",
  gate: "Unlock onboarding",
  unlocked: "Secure session open",
  done: "Submission received",
} as const;

/**
 * Owner-operator onboarding: an access gate, six steps, and a review. All
 * state lives in React memory. Every server outcome is written to the status
 * region in plain language; success is only ever what the server confirmed.
 */
export function Onboarding() {
  const ob = useOnboarding();
  const { state } = ob;
  const unlocked = state.phase === "unlocked" || state.phase === "done";
  const locked = !unlocked;
  const [confirmEnd, setConfirmEnd] = useState(false);

  const handlers = useMemo<StepHandlers>(
    () => ({ onTouched: ob.markTouched, onLeave: ob.setDraft, onSaved: ob.onSaved, onOutcome: ob.onOutcome, onUploaded: ob.addFile }),
    [ob.markTouched, ob.setDraft, ob.onSaved, ob.onOutcome, ob.addFile],
  );

  // After a programmatic step change, move focus to the new step's heading.
  useEffect(() => {
    if (state.navCount === 0) return;
    const id = state.phase === "done" ? "onb-done-title" : `onb-${state.current}-title`;
    document.getElementById(id)?.focus();
  }, [state.navCount, state.current, state.phase]);

  useEffect(() => {
    if (!unlocked) setConfirmEnd(false);
  }, [unlocked]);

  const initialFor = <K extends OnboardingStep>(k: K): StepForms[K] => state.drafts[k] ?? state.saved[k] ?? BLANK[k]();

  const endNow = async () => {
    setConfirmEnd(false);
    await ob.endSession();
  };

  const common = { disabled: locked, handlers, onBack: ob.back };
  const key = `${state.current}-${state.session}`;
  let content: ReactNode;
  if (state.phase === "done") {
    content = <DonePanel submissionId={state.submissionId} busy={state.busy} onEnd={endNow} />;
  } else {
    switch (state.current) {
      case "profile":
        content = <ProfileStep key={key} initial={initialFor("profile")} {...common} />;
        break;
      case "equipment":
        content = <EquipmentStep key={key} initial={initialFor("equipment")} {...common} />;
        break;
      case "insurance":
        content = <InsuranceStep key={key} initial={initialFor("insurance")} files={state.files} {...common} />;
        break;
      case "w9":
        content = <W9Step key={key} initial={initialFor("w9")} files={state.files} {...common} />;
        break;
      case "direct-deposit":
        content = <DirectDepositStep key={key} initial={initialFor("direct-deposit")} files={state.files} {...common} />;
        break;
      case "review":
        content = (
          <ReviewStep
            key={key}
            status={state.status}
            saved={state.saved}
            files={state.files}
            missing={state.missing}
            busy={state.busy}
            disabled={locked}
            onEdit={ob.goTo}
            onBack={ob.back}
            onSubmit={ob.submit}
          />
        );
        break;
    }
  }

  return (
    <div data-onboarding data-onboarding-phase={state.phase} data-onboarding-unlocked={unlocked ? "" : undefined} className="panel steel-edge overflow-hidden">
      {/* Gate / session header + the single status region */}
      <div className="flex flex-col gap-5 border-b border-[var(--line)] p-5 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="eyebrow">Approved operators</span>
            <h3 className="title-sm">{TITLE[state.phase]}</h3>
          </div>
          {unlocked && (
            <div className="flex flex-wrap items-center gap-3" data-onboarding-session>
              {confirmEnd ? (
                <>
                  <span className="small">Unsaved changes will be lost.</span>
                  <button type="button" className="btn btn-ghost !min-h-[42px] !px-4" onClick={endNow} disabled={state.busy}>
                    End anyway
                  </button>
                  <button type="button" className="btn btn-ghost !min-h-[42px] !px-4" onClick={() => setConfirmEnd(false)} disabled={state.busy}>
                    Keep working
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn btn-ghost !min-h-[42px] !px-4"
                  onClick={() => (ob.hasUnsaved ? setConfirmEnd(true) : void endNow())}
                  disabled={state.busy}
                >
                  End session
                </button>
              )}
            </div>
          )}
        </div>

        <StatusRegion message={state.message} />

        {!unlocked && <AccessGate disabled={state.phase === "booting"} busy={state.busy} onUnlock={ob.unlock} />}
      </div>

      {/* Steps. Every control inside is disabled until the server accepts a code. */}
      <div data-onboarding-steps className="grid gap-6 p-5 sm:p-6 lg:grid-cols-12 lg:gap-8 lg:p-8">
        <div className="min-w-0 lg:col-span-4 xl:col-span-3">
          <StepRail current={state.current} status={state.status} done={state.phase === "done"} disabled={locked || state.busy} missing={state.missing} onSelect={ob.goTo} />
        </div>
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-8 xl:col-span-9">
          {locked && (
            <p className="small" data-onboarding-locked-note>
              {state.phase === "locked"
                ? "The steps below stay locked while onboarding is not open on this server."
                : "The steps below open once your access code is accepted."}
            </p>
          )}
          {content}
        </div>
      </div>

      <p className="border-t border-[var(--line)] px-5 py-4 text-[var(--step--2)] leading-relaxed text-[var(--text-low)] sm:px-6 lg:px-8">
        Your entries travel over an encrypted connection to Solidify Transport&apos;s own application and are stored encrypted. They are never emailed and never saved in this browser. Each step is
        stored when you save it; if you reload or close this page, anything not yet saved is lost.
      </p>
    </div>
  );
}
