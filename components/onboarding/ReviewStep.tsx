"use client";

import clsx from "clsx";
import { ONBOARDING_STEPS, STATE_NAMES, type OnboardingStep } from "@/lib/schemas";
import { StepShell } from "./StepShell";
import { MAX_FILES_PER_SUBMISSION, MAX_TOTAL_UPLOAD_BYTES, STATUS_LABEL, STEP_META, formatBytes, lastFour, stepNumber, type StepForms, type StepStatus, type UploadedFile } from "./types";

interface Row {
  label: string;
  value: string;
  /** Spans both columns — for long text such as the authorization. */
  wide?: boolean;
}

const stateName = (v: string): string => (v in STATE_NAMES ? STATE_NAMES[v as keyof typeof STATE_NAMES] : v);

/** Tolerates blank parts (several address fields are optional). */
const address = (line: string, city: string, state: string, zip: string): string => {
  const locality = [city, stateName(state)].filter(Boolean).join(", ");
  const tail = [locality, zip].filter(Boolean).join(" ");
  return [line, tail].filter(Boolean).join(", ") || "—";
};

function rowsFor(step: OnboardingStep, saved: Partial<StepForms>, files: Record<string, UploadedFile>): Row[] {
  const fileName = (id: string): string => (id ? (files[id]?.name ?? `Stored file ${id}`) : "—");
  switch (step) {
    case "profile": {
      const v = saved.profile;
      if (!v) return [];
      return [
        { label: "Company or operator", value: v.companyName },
        { label: "Contact person", value: v.contactPerson },
        { label: "Phone", value: v.phone },
        { label: "Email", value: v.email },
        { label: "Address", value: address(v.addressLine, v.city, v.state, v.zip) },
      ];
    }
    case "equipment": {
      const v = saved.equipment;
      if (!v) return [];
      return [
        { label: "Truck / Power Unit VIN", value: v.powerUnitVin },
        { label: "Truck / Power Unit", value: [v.year, v.make, v.model].filter(Boolean).join(" ") },
        { label: "Capacity", value: v.capacity },
        { label: "USDOT number", value: v.dot },
        { label: "MC number", value: v.mc },
        { label: "Primary service areas", value: v.serviceAreas },
        { label: "GPS / tracking", value: v.gpsTracking },
      ];
    }
    case "insurance": {
      const v = saved.insurance;
      if (!v) return [];
      return [
        { label: "Cargo policy", value: v.cargoPolicyNumber },
        { label: "General liability policy", value: v.generalLiabilityPolicyNumber },
        { label: "Auto liability policy", value: v.autoLiabilityPolicyNumber || "—" },
        { label: "Agent", value: `${v.agentName} · ${v.agentEmail} · ${v.agentPhone}` },
        { label: "Certificates", value: v.certificateFileIds.map(fileName).join(", ") || "—" },
        { label: "Certificate requirements", value: v.acknowledgedLimits ? "Confirmed — holder, additional insured, agent-issued, limits" : "Not confirmed" },
      ];
    }
    case "w9": {
      const v = saved.w9;
      if (!v) return [];
      return [
        { label: "W-9 upload", value: fileName(v.w9FileId) },
        { label: "Complete and signed", value: v.w9Confirmed ? "Confirmed" : "Not confirmed" },
      ];
    }
    case "direct-deposit": {
      const v = saved["direct-deposit"];
      if (!v) return [];
      const rows: Row[] = [
        { label: "Payee", value: v.payeeName },
        { label: "Payee phone", value: v.payeePhone || "—" },
        { label: "Payee address", value: address(v.payeeAddressLine, v.payeeCity, v.payeeState, v.payeeZip) },
      ];
      if (v.payeeMc) rows.push({ label: "Payee MC number", value: v.payeeMc });
      rows.push(
        { label: "EIN", value: lastFour(v.ein) },
        { label: "Financial institution", value: v.bankName || "—" },
        { label: "Institution address", value: address(v.bankAddressLine, v.bankCity, v.bankState, v.bankZip) },
      );
      if (v.bankPhone) rows.push({ label: "Institution phone", value: v.bankPhone });
      if (v.bankFax) rows.push({ label: "Institution fax", value: v.bankFax });
      rows.push(
        { label: "Bank routing number", value: lastFour(v.routingNumber) },
        { label: "Account number", value: lastFour(v.accountNumber) },
        { label: "Type of account", value: v.accountType === "checking" ? "Checking" : v.accountType === "savings" ? "Savings" : "—" },
        { label: "Amount to deposit", value: "100%" },
        { label: "Voided check", value: fileName(v.voidedCheckFileId) },
        { label: "Authorization", value: v.depositAuthorization ? v.authorizationText : "Not authorized", wide: true },
        { label: "By (typed full name)", value: v.signatureName },
        { label: "Date", value: v.signatureDate },
      );
      return rows;
    }
    default:
      return [];
  }
}

const BADGE: Record<StepStatus, string> = {
  "not-started": "border-[var(--line)] text-[var(--text-low)]",
  "in-progress": "border-[color-mix(in_srgb,var(--color-signal-400)_45%,transparent)] text-[var(--color-signal-300)]",
  dirty: "border-[color-mix(in_srgb,var(--color-warn)_45%,transparent)] text-[var(--color-warn)]",
  saved: "border-[color-mix(in_srgb,var(--color-success)_45%,transparent)] text-[var(--color-success)]",
  submitted: "border-[color-mix(in_srgb,var(--color-success)_45%,transparent)] text-[var(--color-success)]",
};

/**
 * Step 6. Everything this page is holding, ready to send: secrets last-four
 * only, documents by name. Submit delivers the whole application in one
 * request; only the server's answer decides whether it succeeded.
 */
export function ReviewStep({
  status,
  saved,
  files,
  missing,
  busy,
  disabled,
  onEdit,
  onBack,
  onSubmit,
}: {
  status: Record<OnboardingStep, StepStatus>;
  saved: Partial<StepForms>;
  files: Record<string, UploadedFile>;
  missing: OnboardingStep[];
  busy: boolean;
  disabled: boolean;
  onEdit: (step: OnboardingStep) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const unsaved = ONBOARDING_STEPS.filter((s) => status[s] !== "saved" && status[s] !== "submitted");
  const attached = Object.values(files);
  const fileCount = attached.length;
  const totalBytes = attached.reduce((n, f) => n + f.bytes, 0);
  const overBudget = totalBytes > MAX_TOTAL_UPLOAD_BYTES;

  return (
    <StepShell
      step="review"
      disabled={disabled || overBudget}
      busy={busy}
      onBack={onBack}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      submitLabel={STEP_META.review.save}
      busyLabel="Submitting…"
    >
      <ol className="grid gap-4" aria-label="Steps to review">
        {ONBOARDING_STEPS.map((step) => {
          const s = status[step];
          const rows = rowsFor(step, saved, files);
          const isMissing = missing.includes(step);
          return (
            <li
              key={step}
              data-review-step={step}
              data-missing={isMissing || undefined}
              className={clsx("flex flex-col gap-4 rounded-[var(--radius-card)] border p-5", isMissing ? "border-[color-mix(in_srgb,var(--color-error)_55%,transparent)]" : "border-[var(--line)]")}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="label">Step {stepNumber(step)}</span>
                  <h4 className="text-[var(--step-0)] font-semibold leading-tight">{STEP_META[step].title}</h4>
                </div>
                <div className="flex items-center gap-3">
                  <span className={clsx("inline-flex items-center rounded-full border px-2 py-[2px] text-[var(--step--2)] leading-[1.3]", BADGE[s])}>
                    {s === "saved" ? "Ready to send" : STATUS_LABEL[s]}
                  </span>
                  <button type="button" className="btn btn-ghost !min-h-[40px] !px-4" onClick={() => onEdit(step)} disabled={disabled || busy} aria-label={`Edit ${STEP_META[step].title}`}>
                    Edit
                  </button>
                </div>
              </div>

              {rows.length > 0 ? (
                <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  {rows.map((r) => (
                    <div key={r.label} className={clsx("flex min-w-0 flex-col gap-0.5", r.wide && "sm:col-span-2")}>
                      <dt className="text-[var(--step--2)] text-[var(--text-low)]">{r.label}</dt>
                      <dd className="break-words text-[var(--step--1)] text-[var(--text-hi)]">{r.value || "—"}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="small">Not saved yet.</p>
              )}

              {isMissing && (
                <p className="field-error" role="alert">
                  This step is not complete yet. Fill it in before submitting.
                </p>
              )}
            </li>
          );
        })}
      </ol>

      {unsaved.length > 0 && (
        <p className="small" data-review-unsaved>
          Still to complete: {unsaved.map((s) => STEP_META[s].title).join(", ")}. Every step must be complete before this can be submitted.
        </p>
      )}

      <p className="small" data-review-budget>
        Documents: <span className="numeral text-[var(--text-hi)]">{formatBytes(totalBytes)}</span> of {formatBytes(MAX_TOTAL_UPLOAD_BYTES)} used ·{" "}
        <span className="numeral text-[var(--text-hi)]">{fileCount}</span> of {MAX_FILES_PER_SUBMISSION} files
      </p>
      {overBudget && (
        <p className="field-error" role="alert">
          Your documents total {formatBytes(totalBytes)}. One submission can carry {formatBytes(MAX_TOTAL_UPLOAD_BYTES)}. Remove or replace the largest before submitting.
        </p>
      )}

      <p className="field-note">
        Submitting confirms the information above is accurate and complete. Everything on this page is sent in one encrypted request and delivered to Solidify Transport; this website keeps no copy. If delivery does not succeed, nothing is submitted and your answers stay on this page so you can try again.
      </p>
    </StepShell>
  );
}
