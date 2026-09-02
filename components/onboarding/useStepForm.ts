"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, type DefaultValues, type FieldValues, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType } from "zod";
import { SECRET_FIELDS, type OnboardingStep } from "@/lib/schemas";
import { saveStep } from "@/lib/onboarding-client";
import { digitsOnly, type AnyStepForm, type StepHandlers } from "./types";

/** Secrets travel as digits only. Everything else is what zod produced. */
export function toWire(values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...values };
  for (const key of SECRET_FIELDS) {
    const v = out[key];
    if (typeof v === "string") out[key] = digitsOnly(v);
  }
  return out;
}

export interface StepFormOptions<T extends FieldValues> {
  step: OnboardingStep;
  schema: ZodType;
  initial: T;
  handlers: StepHandlers;
}

/**
 * One react-hook-form instance per step, wired to the root:
 *  - reports the first edit (so the rail drops a "Saved" badge),
 *  - hands its values back when it unmounts (drafts survive navigation),
 *  - saves through `saveStep` and maps 422 field errors onto the controls.
 * Only `kind === "saved"` ever counts as saved.
 */
export function useStepForm<T extends FieldValues>({ step, schema, initial, handlers }: StepFormOptions<T>) {
  const form = useForm<T>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any),
    defaultValues: initial as DefaultValues<T>,
    mode: "onTouched",
  });
  const [saving, setSaving] = useState(false);
  const { isDirty, errors } = form.formState;

  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });

  useEffect(() => {
    if (isDirty) latest.current.onTouched(step);
  }, [isDirty, step]);

  const { getValues } = form;
  useEffect(() => {
    return () => {
      latest.current.onLeave(step, getValues() as unknown as AnyStepForm);
    };
  }, [step, getValues]);

  const submit = form.handleSubmit(async (parsed) => {
    setSaving(true);
    try {
      const wire = toWire(parsed as Record<string, unknown>);
      const result = await saveStep(step, wire);
      if (result.ok) {
        form.reset(form.getValues());
        latest.current.onSaved(step, wire as unknown as AnyStepForm);
        return;
      }
      if (result.kind === "invalid") {
        const fields = result.fields ?? {};
        const known = Object.keys(fields).filter((k) => k in initial);
        for (const k of known) form.setError(k as Path<T>, { type: "server", message: fields[k] });
        if (known.length > 0) form.setFocus(known[0] as Path<T>);
        const unknown = Object.keys(fields).filter((k) => !(k in initial));
        const text = unknown.length > 0 ? fields[unknown[0]] : known.length > 0 ? "Please check the highlighted fields." : result.message;
        latest.current.onOutcome({ ...result, message: text });
        return;
      }
      latest.current.onOutcome(result);
    } finally {
      setSaving(false);
    }
  });

  const err = (name: keyof T & string): string | undefined => {
    const e = (errors as Record<string, { message?: unknown } | undefined>)[name];
    return typeof e?.message === "string" ? e.message : undefined;
  };

  return { form, submit, saving, err };
}
