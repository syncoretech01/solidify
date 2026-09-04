"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { InquiryForm, type Lane } from "./InquiryForm";
import { ApplyLink } from "@/components/ui/Primitives";

const LANES: { id: Lane; label: string; hint: string }[] = [
  { id: "vehicle", label: "Vehicle shipping quote", hint: "Individuals and businesses shipping a vehicle" },
  { id: "oem", label: "OEM & dealership inquiry", hint: "Manufacturers, dealerships, dealer groups" },
];

/** Three clearly separated inquiry lanes. `?lane=oem|operator` preselects. */
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
      <div role="tablist" aria-label="Inquiry type" className="grid gap-2 sm:grid-cols-2">
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
    </div>
  );
}
