"use client";

import { useEffect, useMemo, useState } from "react";
import { ROUTE_EVENT } from "@/components/car/RouteMap";
import { useForm, type FieldErrors, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { vehicleQuoteSchema, oemInquirySchema, operatorInquirySchema, US_STATES, STATE_NAMES } from "@/lib/schemas";
import { COMPANY } from "@/lib/site";
import { Field, describedBy } from "./Field";
import { PhoneLink } from "@/components/ui/Primitives";

export type Lane = "vehicle" | "oem" | "operator";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; reference: string }
  | { kind: "not_configured"; message: string }
  | { kind: "rate_limited"; retryAfter: number }
  | { kind: "failed"; message: string };

const SCHEMAS = { vehicle: vehicleQuoteSchema, oem: oemInquirySchema, operator: operatorInquirySchema } as const;

// A loose record so one form component can serve three lanes.
type Values = Record<string, string | number | undefined>;

const LANE_COPY: Record<Lane, { title: string; text: string; submit: string; success: string }> = {
  vehicle: {
    title: "Get a vehicle shipping quote",
    text: "Tell us the route and the vehicle. The carrier reviews it and comes back with a quote and a pickup window.",
    submit: "Request my quote",
    success: "Your quote request is with the carrier. We will reach out using the phone or email you provided.",
  },
  oem: {
    title: "Start a commercial inquiry",
    text: "For OEMs, dealerships and dealer groups. Outline the movement and the carrier's team follows up.",
    submit: "Send commercial inquiry",
    success: "Your inquiry is with the carrier's commercial team. We will follow up using the contact details you provided.",
  },
  operator: {
    title: "Owner-operator inquiry",
    text: "Questions before you apply? Send them here. New applications go through our driver portal.",
    submit: "Send inquiry",
    success: "Your message is with the carrier. We will follow up using the contact details you provided.",
  },
};

/**
 * The single inquiry form for all three lanes. Client validation mirrors the
 * server exactly (shared zod schemas); the server's 422 field errors land on
 * the right control by name. Never reports a success it did not receive.
 * `bare` drops the panel chrome so a console can wrap it.
 */
export function InquiryForm({ lane, className, compact = false, bare = false }: { lane: Lane; className?: string; compact?: boolean; bare?: boolean }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const copy = LANE_COPY[lane];
  const schema = SCHEMAS[lane];

  const defaults = useMemo<Values>(
    () => ({
      lane,
      website: "",
      startedAt: Date.now(),
      ...(lane === "vehicle" ? { operable: "operable" } : {}),
    }),
    [lane],
  );

  const {
    register,
    handleSubmit,
    setError,
    reset,
    watch,
    formState: { errors },
  } = useForm<Values>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any),
    defaultValues: defaults,
    mode: "onTouched",
  });

  useEffect(() => {
    reset(defaults);
    setStatus({ kind: "idle" });
  }, [defaults, reset]);

  // The quote console's route map listens for the chosen states.
  const pickupState = watch("pickupState");
  const deliveryState = watch("deliveryState");
  useEffect(() => {
    if (lane !== "vehicle") return;
    window.dispatchEvent(new CustomEvent(ROUTE_EVENT, { detail: { pickupState, deliveryState } }));
  }, [lane, pickupState, deliveryState]);

  const err = (name: string) => (errors as FieldErrors<Values>)[name]?.message as string | undefined;

  const onSubmit = handleSubmit(async (values) => {
    setStatus({ kind: "submitting" });
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...values, lane }),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        reference?: string;
        error?: string;
        message?: string;
        fields?: Record<string, string>;
      };
      if (res.ok && body.ok && body.reference) {
        setStatus({ kind: "success", reference: body.reference });
        return;
      }
      if (res.status === 422 && body.fields) {
        for (const [k, v] of Object.entries(body.fields)) setError(k as Path<Values>, { message: v });
        setStatus({ kind: "idle" });
        return;
      }
      if (res.status === 503) {
        setStatus({ kind: "not_configured", message: body.message ?? `We could not receive your request online right now. Please call ${COMPANY.phone}.` });
        return;
      }
      if (res.status === 429) {
        setStatus({ kind: "rate_limited", retryAfter: Number(res.headers.get("retry-after") ?? 60) });
        return;
      }
      setStatus({ kind: "failed", message: body.message ?? "That did not send. Nothing was submitted — please try again or call us." });
    } catch {
      setStatus({ kind: "failed", message: "We could not reach the server. Nothing was submitted — please check your connection or call us." });
    }
  });

  const wrap = bare ? "flex flex-col gap-6" : "panel steel-edge flex flex-col gap-6 p-6 lg:p-9";

  if (status.kind === "success") {
    return (
      <div className={clsx(wrap, className)} role="status" aria-live="polite">
        <span className="eyebrow">Received</span>
        <h3 className="display-sm">Thank you.</h3>
        <p className="body">{copy.success}</p>
        <p className="small">
          Reference <span className="numeral text-[var(--text-hi)]">{status.reference}</span>. Need us sooner? Call <PhoneLink className="link-underline text-[var(--text-hi)]" />.
        </p>
      </div>
    );
  }

  const busy = status.kind === "submitting";
  const stateOptions = US_STATES.map((s) => (
    <option key={s} value={s}>
      {STATE_NAMES[s]}
    </option>
  ));

  return (
    <form onSubmit={onSubmit} noValidate className={clsx(wrap, className)} aria-busy={busy} data-inquiry-form={lane}>
      {!compact && (
        <div className="flex flex-col gap-2">
          <h3 className="title">{copy.title}</h3>
          <p className="body">{copy.text}</p>
        </div>
      )}

      {/* honeypot — hidden from people, tempting to bots */}
      <div className="sr-only" aria-hidden>
        <label htmlFor={`${lane}-website`}>Website</label>
        <input id={`${lane}-website`} type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>
      <input type="hidden" {...register("startedAt")} />

      {lane === "vehicle" && (
        <>
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="label mb-3">Route</legend>
            <Field id="pickupCity" label="Pickup city" error={err("pickupCity")}>
              <input id="pickupCity" className="input" autoComplete="address-level2" aria-invalid={!!err("pickupCity")} aria-describedby={describedBy("pickupCity", err("pickupCity"))} {...register("pickupCity")} />
            </Field>
            <Field id="pickupState" label="Pickup state" error={err("pickupState")}>
              <select id="pickupState" className="select" defaultValue="" aria-invalid={!!err("pickupState")} {...register("pickupState")}>
                <option value="" disabled>
                  Select state
                </option>
                {stateOptions}
              </select>
            </Field>
            <Field id="deliveryCity" label="Delivery city" error={err("deliveryCity")}>
              <input id="deliveryCity" className="input" aria-invalid={!!err("deliveryCity")} {...register("deliveryCity")} />
            </Field>
            <Field id="deliveryState" label="Delivery state" error={err("deliveryState")}>
              <select id="deliveryState" className="select" defaultValue="" aria-invalid={!!err("deliveryState")} {...register("deliveryState")}>
                <option value="" disabled>
                  Select state
                </option>
                {stateOptions}
              </select>
            </Field>
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-3">
            <legend className="label mb-3">Vehicle</legend>
            <Field id="vehicleYear" label="Year" error={err("vehicleYear")}>
              <input id="vehicleYear" className="input" inputMode="numeric" maxLength={4} placeholder="2021" aria-invalid={!!err("vehicleYear")} {...register("vehicleYear")} />
            </Field>
            <Field id="vehicleMake" label="Make" error={err("vehicleMake")}>
              <input id="vehicleMake" className="input" placeholder="Toyota" aria-invalid={!!err("vehicleMake")} {...register("vehicleMake")} />
            </Field>
            <Field id="vehicleModel" label="Model" error={err("vehicleModel")}>
              <input id="vehicleModel" className="input" placeholder="Tacoma" aria-invalid={!!err("vehicleModel")} {...register("vehicleModel")} />
            </Field>
            <div className="field sm:col-span-2" data-field="operable">
              <span className="field-label">Vehicle condition</span>
              <div className="grid grid-cols-2 gap-3">
                <label className="radio-tile">
                  <input type="radio" value="operable" {...register("operable")} /> Runs and drives
                </label>
                <label className="radio-tile">
                  <input type="radio" value="inoperable" {...register("operable")} /> Does not run
                </label>
              </div>
              {err("operable") ? (
                <p className="field-error" role="alert">
                  {err("operable")}
                </p>
              ) : (
                <p className="field-note">Helps us quote accurately.</p>
              )}
            </div>
            <Field id="preferredDate" label="Preferred date" optional error={err("preferredDate")}>
              <input id="preferredDate" className="input" type="date" {...register("preferredDate")} />
            </Field>
          </fieldset>
        </>
      )}

      {lane === "oem" && (
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="label mb-3">Organization</legend>
          <Field id="company" label="Company" error={err("company")}>
            <input id="company" className="input" autoComplete="organization" aria-invalid={!!err("company")} {...register("company")} />
          </Field>
          <Field id="orgType" label="Organization type" error={err("orgType")}>
            <select id="orgType" className="select" defaultValue="" aria-invalid={!!err("orgType")} {...register("orgType")}>
              <option value="" disabled>
                Select
              </option>
              <option value="oem">OEM / manufacturer</option>
              <option value="dealership">Dealership</option>
              <option value="dealer-group">Dealer group</option>
              <option value="other">Other commercial</option>
            </select>
          </Field>
          <Field id="role" label="Your role" optional error={err("role")}>
            <input id="role" className="input" autoComplete="organization-title" {...register("role")} />
          </Field>
          <Field id="volume" label="Approximate volume" optional note="Vehicles per month, per move, or a range." error={err("volume")}>
            <input id="volume" className="input" {...register("volume")} />
          </Field>
          <Field id="originRegion" label="Origin region(s)" optional error={err("originRegion")}>
            <input id="originRegion" className="input" placeholder="e.g. Northern California" {...register("originRegion")} />
          </Field>
          <Field id="destinationRegion" label="Destination region(s)" optional error={err("destinationRegion")}>
            <input id="destinationRegion" className="input" placeholder="e.g. Arizona, Nevada" {...register("destinationRegion")} />
          </Field>
        </fieldset>
      )}

      {lane === "operator" && (
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="label mb-3">About you</legend>
          <Field id="homeBase" label="Where you are based (city, state)" optional error={err("homeBase")}>
            <input id="homeBase" className="input" {...register("homeBase")} />
          </Field>
          <Field id="equipment" label="Truck / Power Unit and trailer" optional error={err("equipment")}>
            <input id="equipment" className="input" placeholder="Year, make, capacity" {...register("equipment")} />
          </Field>
        </fieldset>
      )}

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="label mb-3">Contact</legend>
        <Field id="name" label="Name" error={err("name")}>
          <input id="name" className="input" autoComplete="name" aria-invalid={!!err("name")} {...register("name")} />
        </Field>
        <Field id="phone" label="Phone" error={err("phone")}>
          <input id="phone" className="input" type="tel" autoComplete="tel" inputMode="tel" aria-invalid={!!err("phone")} {...register("phone")} />
        </Field>
        <Field id="email" label="Email" error={err("email")}>
          <input id="email" className="input" type="email" autoComplete="email" inputMode="email" aria-invalid={!!err("email")} {...register("email")} />
        </Field>
      </fieldset>

      <Field id="notes" label="Notes" optional error={err("notes")}>
        <textarea id="notes" className="textarea" rows={4} {...register("notes")} />
      </Field>

      {status.kind === "not_configured" && (
        <div className="plate flex flex-col gap-3 p-5" role="alert" data-form-state="not-configured">
          <span className="label">Not accepting online inquiries yet</span>
          <p className="body !text-[var(--text-hi)]">{status.message}</p>
          <PhoneLink className="font-display text-[var(--step-2)] font-medium text-[var(--text-hi)]" />
          <p className="field-note">Nothing you entered was sent or stored.</p>
        </div>
      )}
      {status.kind === "rate_limited" && (
        <p className="rounded-md border border-[var(--color-warn)]/40 px-4 py-3 text-[var(--step--1)]" role="alert">
          Too many attempts from this connection. Please try again in about {Math.ceil(status.retryAfter / 60)} minute{status.retryAfter > 90 ? "s" : ""}, or call {COMPANY.phone}.
        </p>
      )}
      {status.kind === "failed" && (
        <p className="rounded-md border border-[var(--color-error)]/40 px-4 py-3 text-[var(--step--1)]" role="alert">
          {status.message}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        <button type="submit" className="btn btn-metal" disabled={busy}>
          <span>{busy ? "Sending…" : copy.submit}</span>
        </button>
        <p className="small">
          Prefer to talk? <PhoneLink className="link-underline text-[var(--text-hi)]" />
        </p>
      </div>
      <p className="field-note">Submitted through a secure connection. We use your details only to respond to this inquiry.</p>
    </form>
  );
}
