"use client";

import { useController } from "react-hook-form";
import { directDepositStepSchema } from "@/lib/schemas";
import { StepShell } from "../StepShell";
import { FileField } from "../FileField";
import { SecretInput } from "../SecretInput";
import { CheckField, Group, StateSelect, TextField } from "../fields";
import { useStepForm } from "../useStepForm";
import { STEP_META, fid, type DirectDepositForm, type FileStepProps } from "../types";

export function DirectDepositStep({ initial, disabled, handlers, onBack, files }: FileStepProps<DirectDepositForm>) {
  const { form, submit, saving, err } = useStepForm<DirectDepositForm>({ step: "direct-deposit", schema: directDepositStepSchema, initial, handlers });
  const { register, control } = form;
  const { field: voided } = useController({ name: "voidedCheckFileId", control });
  const accountTypeError = err("accountType");
  const accountTypeId = fid("accountType");

  return (
    <StepShell step="direct-deposit" disabled={disabled} busy={saving} onBack={onBack} onSubmit={submit} submitLabel={STEP_META["direct-deposit"].save}>
      <Group legend="Payee">
        <TextField id={fid("payeeName")} label="Payee / company name" className="sm:col-span-2" note="Exactly as it appears on the account." autoComplete="organization" error={err("payeeName")} disabled={disabled} registration={register("payeeName")} />
        <TextField id={fid("payeePhone")} label="Payee phone" type="tel" inputMode="tel" autoComplete="tel" error={err("payeePhone")} disabled={disabled} registration={register("payeePhone")} />
        <SecretInput id={fid("ein")} label="EIN" note="9 digits. Masked on screen; only the digits are sent." maxLength={12} error={err("ein")} disabled={disabled} registration={register("ein")} />
        <TextField id={fid("payeeAddressLine")} label="Payee street address" className="sm:col-span-2" autoComplete="street-address" error={err("payeeAddressLine")} disabled={disabled} registration={register("payeeAddressLine")} />
        <TextField id={fid("payeeCity")} label="City" autoComplete="address-level2" error={err("payeeCity")} disabled={disabled} registration={register("payeeCity")} />
        <StateSelect id={fid("payeeState")} label="State" autoComplete="address-level1" error={err("payeeState")} disabled={disabled} registration={register("payeeState")} />
        <TextField id={fid("payeeZip")} label="ZIP" inputMode="numeric" autoComplete="postal-code" maxLength={10} error={err("payeeZip")} disabled={disabled} registration={register("payeeZip")} />
      </Group>

      <Group legend="Financial institution">
        <TextField id={fid("bankName")} label="Financial institution name" className="sm:col-span-2" autoComplete="off" error={err("bankName")} disabled={disabled} registration={register("bankName")} />
        <TextField id={fid("bankAddressLine")} label="Institution address" className="sm:col-span-2" autoComplete="off" error={err("bankAddressLine")} disabled={disabled} registration={register("bankAddressLine")} />
        <TextField id={fid("bankCity")} label="City" autoComplete="off" error={err("bankCity")} disabled={disabled} registration={register("bankCity")} />
        <StateSelect id={fid("bankState")} label="State" autoComplete="off" error={err("bankState")} disabled={disabled} registration={register("bankState")} />
        <TextField id={fid("bankZip")} label="ZIP" inputMode="numeric" autoComplete="off" maxLength={10} error={err("bankZip")} disabled={disabled} registration={register("bankZip")} />
        <TextField id={fid("bankContact")} label="Institution contact" optional autoComplete="off" error={err("bankContact")} disabled={disabled} registration={register("bankContact")} />
        <TextField id={fid("bankPhone")} label="Institution phone" optional type="tel" inputMode="tel" autoComplete="off" className="sm:col-span-2" error={err("bankPhone")} disabled={disabled} registration={register("bankPhone")} />
      </Group>

      <Group legend="Account">
        <TextField
          id={fid("routingNumber")}
          label="Routing number"
          note="9 digits. Checked against the ABA checksum before it is sent."
          inputMode="numeric"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={9}
          error={err("routingNumber")}
          disabled={disabled}
          registration={register("routingNumber")}
        />
        <SecretInput id={fid("accountNumber")} label="Account number" note="4 to 17 digits. Masked on screen; only the digits are sent." maxLength={24} error={err("accountNumber")} disabled={disabled} registration={register("accountNumber")} />
        <fieldset className="field sm:col-span-2" data-field={accountTypeId}>
          <legend className="field-label">Account type</legend>
          <div className="grid grid-cols-2 gap-3">
            <label className="radio-tile" htmlFor={`${accountTypeId}-checking`}>
              <input id={`${accountTypeId}-checking`} type="radio" value="checking" disabled={disabled} aria-invalid={!!accountTypeError} aria-describedby={accountTypeError ? `${accountTypeId}-error` : undefined} {...register("accountType")} />
              Checking
            </label>
            <label className="radio-tile" htmlFor={`${accountTypeId}-savings`}>
              <input id={`${accountTypeId}-savings`} type="radio" value="savings" disabled={disabled} aria-invalid={!!accountTypeError} aria-describedby={accountTypeError ? `${accountTypeId}-error` : undefined} {...register("accountType")} />
              Savings
            </label>
          </div>
          {accountTypeError && (
            <p id={`${accountTypeId}-error`} className="field-error" role="alert">
              {accountTypeError}
            </p>
          )}
        </fieldset>
      </Group>

      <div className="grid gap-4 rounded-[var(--radius-card)] border border-[var(--line)] bg-[color-mix(in_srgb,var(--surface-sunken)_55%,transparent)] p-5">
        <span className="label">Authorization</span>
        <p className="text-[var(--step--1)] font-medium text-[var(--text-hi)]">100% of each settlement is deposited to the account above.</p>
        <CheckField id={fid("depositAuthorization")} registration={register("depositAuthorization")} error={err("depositAuthorization")} disabled={disabled}>
          I authorize Solidify Transport LLC to deposit 100% of each settlement to the account above.
        </CheckField>
      </div>

      <FileField
        id={fid("voidedCheckFileId")}
        label="Voided check"
        purpose="voided-check"
        max={1}
        ids={voided.value ? [voided.value] : []}
        onIdsChange={(ids) => voided.onChange(ids[0] ?? "")}
        files={files}
        onUploaded={handlers.onUploaded}
        onOutcome={handlers.onOutcome}
        disabled={disabled}
        error={err("voidedCheckFileId")}
        note="A voided check for the account above. PDF, JPEG or PNG, 4 MB or smaller. The server checks the file's actual contents, not just its name."
        inputRef={voided.ref}
      />

      <Group legend="Signature">
        <TextField id={fid("signatureName")} label="Signature (typed full name)" note="Typing your full name here is your signature on this authorization." autoComplete="name" error={err("signatureName")} disabled={disabled} registration={register("signatureName")} />
        <TextField id={fid("signatureDate")} label="Date" type="date" autoComplete="off" error={err("signatureDate")} disabled={disabled} registration={register("signatureDate")} />
      </Group>
    </StepShell>
  );
}
