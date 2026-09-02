import clsx from "clsx";

/**
 * The Solidify mark: two stacked carrier-deck strokes converging into a
 * forward chevron. Geometric, single-weight, reads at 24px and at 240px.
 */
export function Mark({ className, title = "Solidify Transport" }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label={title} fill="none">
      <rect x="1" y="1" width="46" height="46" rx="11" fill="var(--color-navy-700)" stroke="rgba(255,255,255,0.10)" />
      <path d="M12 30.5h17.5l6.5-6.5" stroke="var(--color-signal-400)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 21.5h13l5-5" stroke="#F2F5F9" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M31 16.5h5" stroke="#F2F5F9" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ className, stacked = false }: { className?: string; stacked?: boolean }) {
  return (
    <span className={clsx("font-display leading-none tracking-[0.18em]", stacked ? "flex flex-col gap-[0.35em]" : "inline-flex items-baseline gap-[0.6em]", className)}>
      <span className="font-semibold">SOLIDIFY</span>
      <span className={clsx("font-medium text-[var(--text-mid)]", stacked ? "text-[0.62em]" : "text-[0.78em]")}>TRANSPORT</span>
    </span>
  );
}
