"use client";

import { profileStepSchema } from "@/lib/schemas";
import { StepShell } from "../StepShell";
import { Group, StateSelect, TextField } from "../fields";
import { useStepForm } from "../useStepForm";
import { STEP_META, fid, type ProfileForm, type StepProps } from "../types";

export function ProfileStep({ initial, disabled, handlers, onBack }: StepProps<ProfileForm>) {
  const { form, submit, saving, err } = useStepForm<ProfileForm>({ step: "profile", schema: profileStepSchema, initial, handlers });
  const { register } = form;

  return (
    <StepShell step="profile" disabled={disabled} busy={saving} onBack={onBack} onSubmit={submit} submitLabel={STEP_META.profile.save}>
      <Group legend="Business">
        <TextField id={fid("companyName")} label="Company or operator name" className="sm:col-span-2" autoComplete="organization" error={err("companyName")} disabled={disabled} registration={register("companyName")} />
        <TextField id={fid("contactPerson")} label="Contact person" autoComplete="name" error={err("contactPerson")} disabled={disabled} registration={register("contactPerson")} />
        <TextField id={fid("phone")} label="Phone" type="tel" inputMode="tel" autoComplete="tel" error={err("phone")} disabled={disabled} registration={register("phone")} />
        <TextField id={fid("email")} label="Email" type="email" inputMode="email" autoComplete="email" className="sm:col-span-2" error={err("email")} disabled={disabled} registration={register("email")} />
      </Group>

      <Group legend="Business address">
        <TextField id={fid("addressLine")} label="Street address" className="sm:col-span-2" autoComplete="street-address" error={err("addressLine")} disabled={disabled} registration={register("addressLine")} />
        <TextField id={fid("city")} label="City" autoComplete="address-level2" error={err("city")} disabled={disabled} registration={register("city")} />
        <StateSelect id={fid("state")} label="State" autoComplete="address-level1" error={err("state")} disabled={disabled} registration={register("state")} />
        <TextField id={fid("zip")} label="ZIP" inputMode="numeric" autoComplete="postal-code" maxLength={10} error={err("zip")} disabled={disabled} registration={register("zip")} />
      </Group>
    </StepShell>
  );
}
