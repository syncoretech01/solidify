"use client";

import { PhoneLink } from "@/components/ui/Primitives";

/** Shown only after the server confirmed the submission. */
export function DonePanel({ submissionId, busy, onEnd }: { submissionId: string | null; busy: boolean; onEnd: () => void }) {
  return (
    <section aria-labelledby="onb-done-title" data-onboarding-done className="card flex flex-col gap-5 bg-[var(--surface)] p-5 sm:p-6 lg:p-8">
      <span className="eyebrow">Received</span>
      <h3 id="onb-done-title" tabIndex={-1} className="title scroll-mt-[calc(var(--nav-h)+1.5rem)]">
        Onboarding submitted.
      </h3>
      {submissionId && (
        <p className="body">
          Your submission reference is <span className="numeral break-all text-[var(--text-hi)]">{submissionId}</span>. Keep it for your records.
        </p>
      )}
      <p className="body">
        Solidify Transport reviews each submission and will contact you using the phone number or email on your profile. Everything you entered was delivered to Solidify Transport. This website kept no copy of it, and nothing was saved in this browser.</p>
      <p className="small">
        Questions in the meantime? Call <PhoneLink className="link-underline text-[var(--text-hi)]" />.
      </p>
      <div className="pt-1">
        <button type="button" className="btn btn-ghost" onClick={onEnd} disabled={busy}>
          {busy ? "Ending…" : "End session"}
        </button>
      </div>
    </section>
  );
}
