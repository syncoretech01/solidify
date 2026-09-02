"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { InquiryForm, type Lane } from "./InquiryForm";
import { ApplyLink } from "@/components/ui/Primitives";

const LANES: { id: Lane; label: string; hint: string }[] = [
  { id: "vehicle", label: "Vehicle shipping quote", hint: "Individuals and businesses shipping a vehicle" },
  { id: "oem", label: "OEM & dealership inquiry", hint: "Manufacturers, dealerships, dealer groups" },
  { id: "operator", label: "Owner-operator inquiry", hint: "Questions before you apply" },
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
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label="Inquiry type" className="grid gap-2 sm:grid-cols-3">
        {LANES.map((l) => (
          <button
            key={l.id}
            role="tab"
            type="button"
            id={`lane-tab-${l.id}`}
            aria-selected={lane === l.id}
            aria-controls={`lane-panel-${l.id}`}
            onClick={() => setLane(l.id)}
            className={clsx(
              "flex min-h-[64px] flex-col items-start justify-center gap-0.5 rounded-md border px-4 py-2 text-left transition-colors duration-300",
              lane === l.id
                ? "border-[var(--color-signal-400)] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--text-hi)]"
                : "border-[var(--line-strong)] text-[var(--text-mid)] hover:border-[var(--text-low)] hover:text-[var(--text-hi)]",
            )}
          >
            <span className="text-[var(--step--1)] font-semibold">{l.label}</span>
            <span className="text-[var(--step--2)] text-[var(--text-low)]">{l.hint}</span>
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`lane-panel-${lane}`} aria-labelledby={`lane-tab-${lane}`}>
        {lane === "operator" && (
          <p className="mb-4 rounded-md border border-[var(--line-strong)] px-4 py-3 text-[var(--step--1)] text-[var(--text-mid)]">
            Ready to apply? New applications go through our driver portal:{" "}
            <ApplyLink className="link-underline font-medium text-[var(--text-hi)]">start a new application</ApplyLink>. Already approved? Complete{" "}
            <a href="/owner-operators#onboarding" className="link-underline font-medium text-[var(--text-hi)]">
              secure onboarding
            </a>
            .
          </p>
        )}
        <InquiryForm lane={lane} />
      </div>
    </div>
  );
}
