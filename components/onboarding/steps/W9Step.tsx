"use client";

import { useController } from "react-hook-form";
import { w9StepSchema } from "@/lib/schemas";
import { StepShell } from "../StepShell";
import { FileField } from "../FileField";
import { CheckField } from "../fields";
import { useStepForm } from "../useStepForm";
import { STEP_META, fid, type FileStepProps, type W9Form } from "../types";

const IRS_W9_URL = "https://www.irs.gov/pub/irs-pdf/fw9.pdf";

/**
 * Upload only. The official IRS form is the document; this page never
 * re-creates it, and never presents an abbreviated checklist as sufficient.
 */
export function W9Step({ initial, disabled, handlers, onBack, files }: FileStepProps<W9Form>) {
  const { form, submit, saving, err } = useStepForm<W9Form>({ step: "w9", schema: w9StepSchema, initial, handlers });
  const { register, control } = form;
  const { field: w9 } = useController({ name: "w9FileId", control });

  return (
    <StepShell step="w9" disabled={disabled} busy={saving} onBack={onBack} onSubmit={submit} submitLabel={STEP_META.w9.save}>
      <div data-w9-instructions className="grid gap-3 rounded-[var(--radius-card)] border border-[var(--line)] bg-[color-mix(in_srgb,var(--surface-sunken)_55%,transparent)] p-5">
        <span className="label">Official IRS Form W-9</span>
        <p className="text-[var(--step--1)] leading-relaxed text-[var(--text-hi)]">
          Complete all applicable fields on the official current IRS Form W-9 — name and business name, federal tax classification (including line 3b where applicable), exemptions if any, address,
          taxpayer identification number, and the required signature and date — then upload the completed, signed form.
        </p>
        <p className="small">
          Get the current form from the IRS:{" "}
          <a href={IRS_W9_URL} target="_blank" rel="noopener noreferrer" className="link-underline break-all text-[var(--text-hi)]">
            irs.gov/pub/irs-pdf/fw9.pdf<span className="sr-only"> (opens in a new tab)</span>
          </a>
          . One file: PDF, JPEG or PNG, 4 MB or smaller.
        </p>
      </div>

      <FileField
        id={fid("w9FileId")}
        label="Completed, signed W-9"
        purpose="w9"
        max={1}
        ids={w9.value ? [w9.value] : []}
        onIdsChange={(ids) => w9.onChange(ids[0] ?? "")}
        files={files}
        onUploaded={handlers.onUploaded}
        onOutcome={handlers.onOutcome}
        disabled={disabled}
        error={err("w9FileId")}
        note="The server checks the file's actual contents, not just its name. It is delivered to Solidify with your submission and not kept by this website."
        inputRef={w9.ref}
      />

      <CheckField id={fid("w9Confirmed")} registration={register("w9Confirmed")} error={err("w9Confirmed")} disabled={disabled}>
        I have completed all applicable fields on the official IRS Form W-9 and signed and dated it.
      </CheckField>

      <p className="field-note">Your taxpayer identification number is not typed into this page. It travels only inside the signed form you upload.</p>
    </StepShell>
  );
}
