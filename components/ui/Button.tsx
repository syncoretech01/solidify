"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import clsx from "clsx";
import { Magnetic } from "./Magnetic";

/**
 * metal — the primary action: brushed ice → silver with a light sweep.
 * steel — the secondary action: a metallic ring, transparent body.
 * ink   — the primary action on an ice surface.
 * link  — a mono trace link (no box).
 * The old names (primary/ghost/glass/light) still resolve so nothing breaks.
 */
type Variant = "metal" | "steel" | "ink" | "link" | "primary" | "ghost" | "glass" | "light";

const VARIANT_CLASS: Record<Variant, string> = {
  metal: "btn btn-metal",
  steel: "btn btn-steel",
  ink: "btn btn-ink",
  link: "link-trace",
  primary: "btn btn-metal",
  ghost: "btn btn-steel",
  glass: "btn btn-glass",
  light: "btn btn-metal",
};

type Props = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: Variant;
  size?: "md" | "sm";
  className?: string;
  magnetic?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
  external?: boolean;
  arrow?: boolean;
  block?: boolean;
  "aria-label"?: string;
  "data-testid"?: string;
};

const Arrow = () => (
  <svg className="btn-arrow" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * The action primitive. 50px on desktop, 46px on mobile — a control inside a
 * composition, not the composition. External links open in a new tab with
 * rel="noopener noreferrer" and announce it to screen readers.
 */
export function Button({
  children,
  href,
  onClick,
  variant = "metal",
  size = "md",
  className,
  magnetic = true,
  type = "button",
  disabled,
  external = false,
  arrow = true,
  block = false,
  ...rest
}: Props) {
  const isLink = variant === "link";
  const cls = clsx(VARIANT_CLASS[variant], size === "sm" && !isLink && "btn-sm", block && "btn-block", className);

  const inner = (
    <>
      <span>{children}</span>
      {arrow && !isLink && <Arrow />}
      {external && <span className="sr-only"> (opens in a new tab)</span>}
    </>
  );

  let el: ReactNode;
  if (href && external) {
    el = (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} onClick={onClick} {...rest}>
        {inner}
      </a>
    );
  } else if (href) {
    el = (
      <Link href={href} className={cls} onClick={onClick} {...rest}>
        {inner}
      </Link>
    );
  } else {
    el = (
      <button type={type} onClick={onClick} disabled={disabled} className={cls} {...rest}>
        {inner}
      </button>
    );
  }

  if (!magnetic || block || isLink) return el;
  return (
    <Magnetic strength={0.22} className="inline-block">
      {el}
    </Magnetic>
  );
}
