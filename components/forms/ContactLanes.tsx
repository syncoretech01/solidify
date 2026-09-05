"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { InquiryForm, type Lane } from "./InquiryForm";

const LANES: { id: Lane; label: string; hint: string }[] = [
  { id: "vehicle", label: "Vehicle shipping quote", hint: "Individuals and businesses shipping a vehicle" },
  { id: "oem", label: "OEM & dealership inquiry", hint: "Manufacturers, dealerships, dealer groups" },
  { id: "driver", label: "Driving with Solidify", hint: "Drivers who would run the carrier's equipment" },
];

/**
 * Three separated inquiry lanes. `?lane=oem|driver` preselects one; anything
 * else — including the retired `?lane=operator` — falls back to the vehicle
 * lane, because the value is checked against LANES rather than trusted.
 *
 * Owner-operators are deliberately NOT a lane here. Someone who owns their
 * Truck / Power Unit has an application to complete, not a message to send,
 * so they are pointed at the page that runs it.
 */
export function ContactLanes() {
  const params = useSearchParams();
  const initial = (params.get("lane") as Lane | null) ?? "vehicle";
  const [lane, setLane] = useState<Lane>(LANES.some((l) => l.id === initial) ? initial : "vehicle");

  useEffect(() => {
    const p = params.get("lane") as Lane | null;
    if (p && LANES.some((l) => l.id === p)) setLane(p);
  }, [params]);

  return (
    <div className="flex flex-col gap-7">
      <div role="tablist" aria-label="Inquiry type" className="grid gap-2 sm:grid-cols-3">
        {LANES.map((l, i) => (
          <button key={l.id} role="tab" type="button" id={`lane-tab-${l.id}`} aria-selected={lane === l.id} aria-controls={`lane-panel-${l.id}`} onClick={() => setLane(l.id)} className="seg">
            <span className="numeral mb-2 block text-[var(--step--2)] text-[var(--text-low)]" aria-hidden>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-[var(--step--1)] font-medium">{l.label}</span>
            <span className="text-[var(--step--2)] text-[var(--text-low)]">{l.hint}</span>
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`lane-panel-${lane}`} aria-labelledby={`lane-tab-${lane}`}>
        <InquiryForm lane={lane} bare />
      </div>

      {lane === "driver" && (
        <p className="small border-t border-[var(--line)] pt-5">
          Own your Truck / Power Unit?{" "}
          <Link href="/owner-operators" className="link-underline font-medium text-[var(--text-hi)]">
            Owner-operators run their own equipment
          </Link>{" "}
          and start with an application instead.
        </p>
      )}
    </div>
  );
}
