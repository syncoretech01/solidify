import type { ReactNode } from "react";
import clsx from "clsx";
import { COMPANY, APPLY_URL } from "@/lib/site";

export type Surface = "deep" | "navy" | "steel" | "gunmetal" | "ice";

/** A themed section. Declares its surface; every child resolves colour from it. */
export function Section({
  children,
  surface = "navy",
  className,
  id,
  tight = false,
  flush = false,
  as: Tag = "section",
  ariaLabelledBy,
}: {
  children: ReactNode;
  surface?: Surface;
  className?: string;
  id?: string;
  tight?: boolean;
  flush?: boolean;
  as?: "section" | "div" | "header" | "footer";
  ariaLabelledBy?: string;
}) {
  return (
    <Tag
      id={id}
      data-surface={surface}
      data-section={id}
      aria-labelledby={ariaLabelledBy}
      className={clsx("section", tight && "section-tight", flush && "section-flush", className)}
    >
      {children}
    </Tag>
  );
}

export function Eyebrow({ children, className, plain = false }: { children: ReactNode; className?: string; plain?: boolean }) {
  return <span className={clsx("eyebrow", plain && "eyebrow-plain", className)}>{children}</span>;
}

/** Section header: eyebrow + heading + optional lead. */
export function SectionHead({
  eyebrow,
  title,
  lead,
  className,
  size = "md",
  align = "left",
  id,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  align?: "left" | "center";
  id?: string;
}) {
  const cls = size === "lg" ? "display-lg" : size === "sm" ? "display-sm" : "display-md";
  return (
    <div className={clsx("flex flex-col gap-5", align === "center" && "items-center text-center", className)}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 id={id} className={clsx(cls, "max-w-[18ch]")}>
        {title}
      </h2>
      {lead && <p className="lead measure">{lead}</p>}
    </div>
  );
}

/** The one place the phone number is written. */
export function PhoneLink({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <a href={COMPANY.phoneHref} className={className} data-phone-link>
      {children ?? COMPANY.phone}
    </a>
  );
}

/** The one place the external application URL is written. */
export function ApplyLink({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <a href={APPLY_URL} target="_blank" rel="noopener noreferrer" className={className} data-apply-cta>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export function Rule({ accent = false, className }: { accent?: boolean; className?: string }) {
  return <div aria-hidden className={clsx(accent ? "rule-accent" : "rule", className)} />;
}

/** Numbered index chip used across process and list modules. */
export function Index({ n, className }: { n: number | string; className?: string }) {
  return (
    <span className={clsx("numeral text-[var(--step--2)] tracking-[0.14em] text-[var(--accent)]", className)}>
      {String(n).padStart(2, "0")}
    </span>
  );
}
