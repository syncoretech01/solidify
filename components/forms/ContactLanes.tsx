"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { InquiryForm, type Lane } from "./InquiryForm";
import { ApplyLink } from "@/components/ui/Primitives";
import { Blueprint } from "@/components/graphics/Blueprint";

const LANES: { id: Lane; label: string; hint: string; icon: "iconCar" | "iconRows" | "iconHauler" }[] = [
  { id: "vehicle", label: "Vehicle shipping quote", hint: "Individuals and businesses shipping a vehicle", icon: "iconCar" },
  { id: "oem", label: "OEM & dealership inquiry", hint: "Manufacturers, dealerships, dealer groups", icon: "iconRows" },
  { id: "operator", label: "Owner-operator inquiry", hint: "Questions before you apply", icon: "iconHauler" },
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
      <div role="tablist" aria-label="Inquiry type" className="grid gap-2 sm:grid-cols-3">
        {LANES.map((l) => (
          <button key={l.id} role="tab" type="button" id={`lane-tab-${l.id}`} aria-selected={lane === l.id} aria-controls={`lane-panel-${l.id}`} onClick={() => setLane(l.id)} className="seg">
            <span className="mb-1 block h-8 w-16 opacity-80" aria-hidden>
              <Blueprint view={l.icon} draw={false} className="h-full w-full" />
            </span>
            <span className="text-[var(--step--1)] font-semibold">{l.label}</span>
            <span className="text-[var(--step--2)] text-[var(--text-low)]">{l.hint}</span>
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`lane-panel-${lane}`} aria-labelledby={`lane-tab-${lane}`}>
        {lane === "operator" && (
          <p className="mb-5 rounded-md border border-[var(--line-strong)] px-4 py-3 text-[var(--step--1)] text-[var(--text-mid)]">
            Ready to apply? New applications go through our driver portal:{" "}
            <ApplyLink className="link-underline font-medium text-[var(--text-hi)]">start a new application</ApplyLink>. Already approved? Complete{" "}
            <a href="/owner-operators#onboarding" className="link-underline font-medium text-[var(--text-hi)]">
              secure onboarding
            </a>
            .
          </p>
        )}
        <InquiryForm lane={lane} bare />
      </div>
    </div>
  );
}
