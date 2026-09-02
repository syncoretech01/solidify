"use client";

import { equipmentStepSchema } from "@/lib/schemas";
import { StepShell } from "../StepShell";
import { Group, TextAreaField, TextField } from "../fields";
import { useStepForm } from "../useStepForm";
import { STEP_META, fid, type EquipmentForm, type StepProps } from "../types";

export function EquipmentStep({ initial, disabled, handlers, onBack }: StepProps<EquipmentForm>) {
  const { form, submit, saving, err } = useStepForm<EquipmentForm>({ step: "equipment", schema: equipmentStepSchema, initial, handlers });
  const { register } = form;

  return (
    <StepShell step="equipment" disabled={disabled} busy={saving} onBack={onBack} onSubmit={submit} submitLabel={STEP_META.equipment.save}>
      <Group legend="Truck / power unit">
        <TextField
          id={fid("powerUnitVin")}
          label="Truck / Power Unit VIN"
          className="sm:col-span-2"
          note="17 characters. A VIN never contains the letters I, O or Q."
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={17}
          style={{ textTransform: "uppercase" }}
          error={err("powerUnitVin")}
          disabled={disabled}
          registration={register("powerUnitVin")}
        />
        <TextField id={fid("year")} label="Year" inputMode="numeric" maxLength={4} autoComplete="off" error={err("year")} disabled={disabled} registration={register("year")} />
        <TextField id={fid("make")} label="Make" autoComplete="off" error={err("make")} disabled={disabled} registration={register("make")} />
        <TextField id={fid("model")} label="Model" autoComplete="off" error={err("model")} disabled={disabled} registration={register("model")} />
        <TextField id={fid("capacity")} label="Capacity" note="How many vehicles you can carry, or the rated capacity." autoComplete="off" error={err("capacity")} disabled={disabled} registration={register("capacity")} />
      </Group>

      <Group legend="Operating authority">
        <TextField id={fid("dot")} label="USDOT number" inputMode="numeric" maxLength={8} autoComplete="off" error={err("dot")} disabled={disabled} registration={register("dot")} />
        <TextField id={fid("mc")} label="MC number" inputMode="numeric" maxLength={8} autoComplete="off" error={err("mc")} disabled={disabled} registration={register("mc")} />
      </Group>

      <Group legend="Operations">
        <TextAreaField id={fid("serviceAreas")} label="Primary service areas" className="sm:col-span-2" note="The states, regions or lanes you run most." error={err("serviceAreas")} disabled={disabled} registration={register("serviceAreas")} />
        <TextField id={fid("gpsTracking")} label="GPS / tracking" className="sm:col-span-2" note="The GPS or tracking system in the truck / power unit, or “None”." autoComplete="off" error={err("gpsTracking")} disabled={disabled} registration={register("gpsTracking")} />
      </Group>
    </StepShell>
  );
}
