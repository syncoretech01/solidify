"use client";

import { useController } from "react-hook-form";
import { insuranceStepSchema } from "@/lib/schemas";
import { INSURANCE } from "@/lib/site";
import { StepShell } from "../StepShell";
import { FileField } from "../FileField";
import { CheckField, Group, TextField } from "../fields";
import { useStepForm } from "../useStepForm";
import { STEP_META, fid, type FileStepProps, type InsuranceForm } from "../types";

export function InsuranceStep({ initial, disabled, handlers, onBack, files }: FileStepProps<InsuranceForm>) {
  const { form, submit, saving, err } = useStepForm<InsuranceForm>({ step: "insurance", schema: insuranceStepSchema, initial, handlers });
  const { register, control } = form;
  const { field: certs } = useController({ name: "certificateFileIds", control });

  return (
    <StepShell step="insurance" disabled={disabled} busy={saving} onBack={onBack} onSubmit={submit} submitLabel={STEP_META.insurance.save}>
      {/* Confirmed limits and certificate holder — read-only, from lib/site.ts */}
      <div role="group" aria-labelledby="onb-limits-title" className="grid gap-4 rounded-[var(--radius-card)] border border-[var(--line)] bg-[color-mix(in_srgb,var(--surface-sunken)_55%,transparent)] p-5">
        <span id="onb-limits-title" className="label">
          Required limits
        </span>
        <dl className="grid gap-3 sm:grid-cols-2">
          {INSURANCE.requirements.map((r) => (
            <div key={r.id} className="flex flex-col gap-0.5">
              <dt className="text-[var(--step--2)] text-[var(--text-low)]">
                {r.label} · {r.note}
              </dt>
              <dd className="numeral text-[var(--step-0)] font-semibold text-[var(--text-hi)]">{r.limit}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-col gap-1 border-t border-[var(--line)] pt-4">
          <span className="label">Certificate holder</span>
          {INSURANCE.certificateHolder.map((l) => (
            <span key={l} className="text-[var(--step--1)] text-[var(--text-hi)]">
              {l}
            </span>
          ))}
        </div>
      </div>

      <Group legend="Policies">
        <TextField id={fid("cargoPolicyNumber")} label="Cargo insurance policy number" autoComplete="off" error={err("cargoPolicyNumber")} disabled={disabled} registration={register("cargoPolicyNumber")} />
        <TextField id={fid("generalLiabilityPolicyNumber")} label="General liability policy number" autoComplete="off" error={err("generalLiabilityPolicyNumber")} disabled={disabled} registration={register("generalLiabilityPolicyNumber")} />
        <TextField id={fid("autoLiabilityPolicyNumber")} label="Auto liability policy number" optional autoComplete="off" error={err("autoLiabilityPolicyNumber")} disabled={disabled} registration={register("autoLiabilityPolicyNumber")} />
      </Group>

      <Group legend="Insurance agent" columns={3}>
        <TextField id={fid("agentName")} label="Agent name" autoComplete="off" error={err("agentName")} disabled={disabled} registration={register("agentName")} />
        <TextField id={fid("agentEmail")} label="Agent email" type="email" inputMode="email" autoComplete="off" error={err("agentEmail")} disabled={disabled} registration={register("agentEmail")} />
        <TextField id={fid("agentPhone")} label="Agent phone" type="tel" inputMode="tel" autoComplete="off" error={err("agentPhone")} disabled={disabled} registration={register("agentPhone")} />
      </Group>

      <FileField
        id={fid("certificateFileIds")}
        label="Certificates of insurance"
        purpose="certificate"
        max={3}
        ids={certs.value}
        onIdsChange={(ids) => certs.onChange(ids)}
        files={files}
        onUploaded={handlers.onUploaded}
        onOutcome={handlers.onOutcome}
        disabled={disabled}
        error={err("certificateFileIds")}
        note="Up to 3 files. PDF, JPEG or PNG, 4 MB or smaller each. The server checks each file's actual contents, not just its name."
        inputRef={certs.ref}
      />

      <CheckField id={fid("acknowledgedLimits")} registration={register("acknowledgedLimits")} error={err("acknowledgedLimits")} disabled={disabled}>
        I confirm my coverage meets the required limits above, and that my certificate names Solidify Transport LLC as certificate holder.
      </CheckField>
    </StepShell>
  );
}
