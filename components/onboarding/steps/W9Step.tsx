"use client";

import { useController } from "react-hook-form";
import { w9StepSchema } from "@/lib/schemas";
import { Index } from "@/components/ui/Primitives";
import { StepShell } from "../StepShell";
import { FileField } from "../FileField";
import { CheckField } from "../fields";
import { useStepForm } from "../useStepForm";
import { STEP_META, fid, type FileStepProps, type W9Form } from "../types";

const IRS_W9_URL = "https://www.irs.gov/pub/irs-pdf/fw9.pdf";

/** Upload only. The official IRS form is the document; this page never re-creates it. */
export function W9Step({ initial, disabled, handlers, onBack, files }: FileStepProps<W9Form>) {
  const { form, submit, saving, err } = useStepForm<W9Form>({ step: "w9", schema: w9StepSchema, initial, handlers });
  const { register, control } = form;
  const { field: w9 } = useController({ name: "w9FileId", control });

  return (
    <StepShell step="w9" disabled={disabled} busy={saving} onBack={onBack} onSubmit={submit} submitLabel={STEP_META.w9.save}>
      <ol className="grid gap-3 sm:grid-cols-3" aria-label="How to provide your W-9">
        <li className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-[var(--line)] p-4">
          <Index n={1} />
          <span className="text-[var(--step--1)] font-semibold text-[var(--text-hi)]">Download the official form</span>
          <span className="small">
            Get Form W-9 from the IRS:{" "}
            <a href={IRS_W9_URL} target="_blank" rel="noopener noreferrer" className="link-underline break-all text-[var(--text-hi)]">
              irs.gov/pub/irs-pdf/fw9.pdf<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </span>
        </li>
        <li className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-[var(--line)] p-4">
          <Index n={2} />
          <span className="text-[var(--step--1)] font-semibold text-[var(--text-hi)]">Complete and sign it</span>
          <span className="small">Fill in every required line, then sign and date it.</span>
        </li>
        <li className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-[var(--line)] p-4">
          <Index n={3} />
          <span className="text-[var(--step--1)] font-semibold text-[var(--text-hi)]">Upload it here</span>
          <span className="small">One file: PDF, JPEG or PNG, 4 MB or smaller.</span>
        </li>
      </ol>

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
        note="The server checks the file's actual contents, not just its name. Stored encrypted; never emailed."
        inputRef={w9.ref}
      />

      <CheckField id={fid("w9Confirmed")} registration={register("w9Confirmed")} error={err("w9Confirmed")} disabled={disabled}>
        I confirm this W-9 is complete and signed.
      </CheckField>

      <p className="field-note">Your taxpayer identification number is not typed into this page. It travels only inside the signed form you upload.</p>
    </StepShell>
  );
}
