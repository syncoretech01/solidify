"use client";

import { useController } from "react-hook-form";
import { DIRECT_DEPOSIT_AUTHORIZATION_TEXT, STATE_NAMES, directDepositStepSchema } from "@/lib/schemas";
import { COMPANY } from "@/lib/site";
import { StepShell } from "../StepShell";
import { FileField } from "../FileField";
import { SecretInput } from "../SecretInput";
import { CheckField, Group, StateSelect, TextField } from "../fields";
import { useStepForm } from "../useStepForm";
import { STEP_META, fid, type DirectDepositForm, type FileStepProps } from "../types";

/** Payer Information exactly as printed on the form — the state spelled out. Facts from lib/site.ts. */
const PAYER_LINE = [COMPANY.legalName, COMPANY.street, `${COMPANY.city}, ${STATE_NAMES[COMPANY.state]} ${COMPANY.zip}`, COMPANY.phone].join(" · ");

const ATTACHMENT_STATEMENT = "Attached to this authorization is a voided check for my account.";

/**
 * Direct Deposit Authorization — New Authorization. Every field on the
 * client's form, in the form's order. Which fields are mandatory is decided
 * in `directDepositStepSchema` (see its comment); the UI only mirrors it.
 */
export function DirectDepositStep({ initial, disabled, handlers, onBack, files }: FileStepProps<DirectDepositForm>) {
  const { form, submit, saving, err } = useStepForm<DirectDepositForm>({ step: "direct-deposit", schema: directDepositStepSchema, initial, handlers });
  const { register, control } = form;
  const { field: voided } = useController({ name: "voidedCheckFileId", control });
  const accountTypeError = err("accountType");
  const accountTypeId = fid("accountType");

  return (
    <StepShell step="direct-deposit" disabled={disabled} busy={saving} onBack={onBack} onSubmit={submit} submitLabel={STEP_META["direct-deposit"].save}>
      {/* Payer Information — read-only */}
      <div data-payer className="grid gap-1.5 rounded-[var(--radius-card)] border border-[var(--line)] bg-[color-mix(in_srgb,var(--surface-sunken)_55%,transparent)] p-5">
        <span className="label">Payer</span>
        <p className="text-[var(--step--1)] text-[var(--text-hi)]">{PAYER_LINE}</p>
      </div>

      <Group legend="Payee">
        <TextField id={fid("payeeName")} label="Company name" className="sm:col-span-2" note="Exactly as it appears on the account." autoComplete="organization" error={err("payeeName")} disabled={disabled} registration={register("payeeName")} />
        <TextField id={fid("payeeAddressLine")} label="Street address" optional className="sm:col-span-2" autoComplete="street-address" error={err("payeeAddressLine")} disabled={disabled} registration={register("payeeAddressLine")} />
        <TextField id={fid("payeeCity")} label="City" optional autoComplete="address-level2" error={err("payeeCity")} disabled={disabled} registration={register("payeeCity")} />
        <StateSelect id={fid("payeeState")} label="State" optional autoComplete="address-level1" error={err("payeeState")} disabled={disabled} registration={register("payeeState")} />
        <TextField id={fid("payeeZip")} label="ZIP" optional inputMode="numeric" autoComplete="postal-code" maxLength={10} error={err("payeeZip")} disabled={disabled} registration={register("payeeZip")} />
        <TextField id={fid("payeePhone")} label="Phone number" optional type="tel" inputMode="tel" autoComplete="tel" error={err("payeePhone")} disabled={disabled} registration={register("payeePhone")} />
        <TextField id={fid("payeeMc")} label="MC number" optional inputMode="numeric" maxLength={8} autoComplete="off" error={err("payeeMc")} disabled={disabled} registration={register("payeeMc")} />
        <SecretInput id={fid("ein")} label="EIN" note="9 digits. Masked on screen; only the digits are sent." maxLength={12} error={err("ein")} disabled={disabled} registration={register("ein")} />
      </Group>

      <Group legend="Financial institution">
        <TextField id={fid("bankName")} label="Name" optional className="sm:col-span-2" autoComplete="off" error={err("bankName")} disabled={disabled} registration={register("bankName")} />
        <TextField id={fid("bankAddressLine")} label="Street address" optional className="sm:col-span-2" autoComplete="off" error={err("bankAddressLine")} disabled={disabled} registration={register("bankAddressLine")} />
        <TextField id={fid("bankCity")} label="City" optional autoComplete="off" error={err("bankCity")} disabled={disabled} registration={register("bankCity")} />
        <StateSelect id={fid("bankState")} label="State" optional autoComplete="off" error={err("bankState")} disabled={disabled} registration={register("bankState")} />
        <TextField id={fid("bankZip")} label="ZIP" optional inputMode="numeric" autoComplete="off" maxLength={10} error={err("bankZip")} disabled={disabled} registration={register("bankZip")} />
        <TextField id={fid("bankPhone")} label="Phone number" optional type="tel" inputMode="tel" autoComplete="off" error={err("bankPhone")} disabled={disabled} registration={register("bankPhone")} />
        <TextField id={fid("bankFax")} label="Fax number" optional type="tel" inputMode="tel" autoComplete="off" className="sm:col-span-2" error={err("bankFax")} disabled={disabled} registration={register("bankFax")} />
      </Group>

      <Group legend="Account">
        <SecretInput
          id={fid("routingNumber")}
          label="Bank routing number"
          note="9 digits. Checked against the ABA checksum before it is sent. Masked on screen; only the digits are sent."
          maxLength={12}
          error={err("routingNumber")}
          disabled={disabled}
          registration={register("routingNumber")}
        />
        <SecretInput id={fid("accountNumber")} label="Account number" note="4 to 17 digits. Masked on screen; only the digits are sent." maxLength={24} error={err("accountNumber")} disabled={disabled} registration={register("accountNumber")} />
        <fieldset className="field sm:col-span-2" data-field={accountTypeId}>
          <legend className="field-label">Type of account</legend>
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
        {/* Fixed by the form; not an input. */}
        <div className="field sm:col-span-2" data-field={fid("amountToDeposit")} data-amount-to-deposit>
          <span className="field-label">Amount to deposit</span>
          <p className="numeral text-[var(--step-0)] font-semibold text-[var(--text-hi)]">100%</p>
        </div>
      </Group>

      {/* Attachments */}
      <div className="grid gap-3">
        <p data-attachment-statement className="text-[var(--step--1)] text-[var(--text-hi)]">
          {ATTACHMENT_STATEMENT}
        </p>
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
      </div>

      {/* Authorization — the checkbox label IS the consent text, verbatim. */}
      <div data-authorization className="grid gap-4 rounded-[var(--radius-card)] border border-[var(--line)] bg-[color-mix(in_srgb,var(--surface-sunken)_55%,transparent)] p-5">
        <span className="label">Authorization</span>
        <CheckField id={fid("depositAuthorization")} registration={register("depositAuthorization")} error={err("depositAuthorization")} disabled={disabled}>
          {DIRECT_DEPOSIT_AUTHORIZATION_TEXT}
        </CheckField>
        {/* The exact wording and its version travel with the step; the server accepts only the current pair, so the record stores what was agreed to. */}
        <input type="hidden" disabled={disabled} {...register("authorizationText")} />
        <input type="hidden" disabled={disabled} {...register("authorizationVersion")} />
      </div>

      <Group legend="Signature">
        <TextField id={fid("signatureName")} label="By (typed full name)" note="Typing your full name here is your signature on this authorization." autoComplete="name" error={err("signatureName")} disabled={disabled} registration={register("signatureName")} />
        <TextField id={fid("signatureDate")} label="Date" type="date" autoComplete="off" error={err("signatureDate")} disabled={disabled} registration={register("signatureDate")} />
      </Group>
    </StepShell>
  );
}
