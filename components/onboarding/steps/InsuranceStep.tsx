"use client";

import { useController } from "react-hook-form";
import { insuranceStepSchema } from "@/lib/schemas";
import { INSURANCE } from "@/lib/site";
import { StepShell } from "../StepShell";
import { FileField } from "../FileField";
import { CheckField, Group, TextField } from "../fields";
import { useStepForm } from "../useStepForm";
import { STEP_META, fid, type FileStepProps, type InsuranceForm } from "../types";

/** The instruction sheet's own phrasing for each minimum. The limits themselves come from lib/site.ts. */
const MINIMUM_PHRASE: Record<(typeof INSURANCE.requirements)[number]["id"], string> = {
  cargo: "minimum cargo limit",
  auto: "minimum combined single limit",
  "gl-occ": "minimum each occurrence",
  "gl-agg": "minimum general aggregate",
};

export function InsuranceStep({ initial, disabled, handlers, onBack, files }: FileStepProps<InsuranceForm>) {
  const { form, submit, saving, err } = useStepForm<InsuranceForm>({ step: "insurance", schema: insuranceStepSchema, initial, handlers });
  const { register, control } = form;
  const { field: certs } = useController({ name: "certificateFileIds", control });

  return (
    <StepShell step="insurance" disabled={disabled} busy={saving} onBack={onBack} onSubmit={submit} submitLabel={STEP_META.insurance.save}>
      {/* CARRIER – INSURANCE INSTRUCTIONS, verbatim in substance. Holder lines and limits are read from lib/site.ts, never retyped. */}
      <div
        role="group"
        aria-labelledby="onb-cert-req-title"
        data-certificate-requirements
        className="grid gap-4 rounded-[var(--radius-card)] border border-[var(--line)] bg-[color-mix(in_srgb,var(--surface-sunken)_55%,transparent)] p-5"
      >
        <span id="onb-cert-req-title" className="label">
          Certificate requirements
        </span>
        <p className="text-[var(--step--1)] text-[var(--text-hi)]">The certificate must show the following, sent from your insurance agent:</p>

        <div className="flex flex-col gap-1.5">
          <span className="text-[var(--step--1)] font-medium text-[var(--text-hi)]">Certificate holder must be shown as additional insured:</span>
          <address className="flex flex-col not-italic">
            {INSURANCE.certificateHolder.map((l) => (
              <span key={l} className="text-[var(--step--1)] text-[var(--text-hi)]">
                {l}
              </span>
            ))}
          </address>
        </div>

        <div className="flex flex-col gap-1.5 border-t border-[var(--line)] pt-4">
          <span className="text-[var(--step--1)] font-medium text-[var(--text-hi)]">Coverages — the certificate must include:</span>
          <ul className="flex flex-col gap-1" aria-label="Required coverages">
            {INSURANCE.requirements.map((r) => (
              <li key={r.id} className="text-[var(--step--1)] text-[var(--text-hi)]">
                {r.label} — {MINIMUM_PHRASE[r.id]} <span className="numeral font-semibold">{r.limit}</span>
              </li>
            ))}
          </ul>
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
        note="Issued and sent by your insurance agent, then uploaded here. Up to 3 files. PDF, JPEG or PNG, 4 MB or smaller each. The server checks each file's actual contents, not just its name."
        inputRef={certs.ref}
      />

      <CheckField id={fid("acknowledgedLimits")} registration={register("acknowledgedLimits")} error={err("acknowledgedLimits")} disabled={disabled}>
        My certificate shows Solidify Transport LLC as certificate holder and additional insured, is sent from my insurance agent, and meets the limits above.
      </CheckField>
    </StepShell>
  );
}
