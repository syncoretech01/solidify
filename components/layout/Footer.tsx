"use client";

import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/motion";
import { COMPANY, ADDRESS_LINES, FOOTER_LINKS, CLAIMS, CLIENT_DATA, has, CTA } from "@/lib/site";
import { PhoneLink } from "@/components/ui/Primitives";
import { Mark } from "./Mark";

/**
 * The close. A building-scale wordmark parallaxes up out of the deep navy
 * with a glow gathering behind it; the index and company identity sit above.
 * Contact rows are gated on has() — a null client value produces no row.
 */
export function Footer() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const word = el.querySelector("[data-footer-word]");
      const glow = el.querySelector("[data-footer-glow]");
      gsap.fromTo(
        word,
        { yPercent: 26, opacity: 0.3 },
        {
          yPercent: -2,
          opacity: 1,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top 85%", end: "bottom bottom", scrub: 0.8 },
        },
      );
      gsap.fromTo(
        glow,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom bottom", scrub: 0.8 } },
      );
    },
    { scope: root },
  );

  const year = new Date().getFullYear();

  return (
    <footer ref={root} data-surface="deep" className="relative isolate overflow-hidden bg-[var(--surface)] text-[var(--text-hi)]">
      <div
        aria-hidden
        data-footer-glow
        className="pointer-events-none absolute left-1/2 top-[62%] -z-10 h-[60vw] w-[90vw] -translate-x-1/2 rounded-full opacity-0 blur-3xl [background:radial-gradient(closest-side,rgba(47,107,255,0.22),transparent_70%)]"
      />

      <div className="shell-wide flex flex-col gap-14 pb-10 pt-[clamp(4rem,8vw,7rem)]">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-3" aria-label={`${COMPANY.name} — home`}>
              <Mark className="h-10 w-10" />
              <span className="font-display text-[1rem] font-semibold tracking-[0.18em]">SOLIDIFY</span>
            </Link>
            <p className="body max-w-[38ch]">
              {COMPANY.descriptor}. {CLAIMS.coverageLong}, with strong Western US coverage. {CLAIMS.role}.
            </p>
            <Link href={CTA.quote.href} className="btn btn-primary w-fit">
              {CTA.quote.label}
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            <span className="label">Services</span>
            <ul role="list" className="flex flex-col gap-3">
              {FOOTER_LINKS.services.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="link-underline text-[var(--text-mid)] transition-colors hover:text-[var(--text-hi)]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <span className="label">Company</span>
            <ul role="list" className="flex flex-col gap-3">
              {FOOTER_LINKS.company.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="link-underline text-[var(--text-mid)] transition-colors hover:text-[var(--text-hi)]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <address className="flex flex-col gap-4 not-italic">
            <span className="label">Contact</span>
            <div className="flex flex-col gap-1 text-[var(--text-mid)]">
              <span className="font-medium text-[var(--text-hi)]">{COMPANY.legalName}</span>
              {ADDRESS_LINES.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </div>
            <PhoneLink className="link-underline w-fit font-medium text-[var(--text-hi)]" />
            {has("email") && (
              <a href={`mailto:${CLIENT_DATA.email}`} className="link-underline w-fit text-[var(--text-mid)]">
                {CLIENT_DATA.email}
              </a>
            )}
          </address>
        </div>

        <div className="rule" />

        <div className="flex flex-col gap-3 text-[var(--step--2)] text-[var(--text-low)] md:flex-row md:items-center md:justify-between">
          <span>
            © {year} {COMPANY.legalName}. {COMPANY.descriptor}.
            {has("usdot") && <> USDOT {CLIENT_DATA.usdot}.</>}
            {has("mc") && <> MC {CLIENT_DATA.mc}.</>}
          </span>
          <span>
            Owner-operators: apply through our{" "}
            <Link href="/owner-operators" className="link-underline text-[var(--text-mid)]">
              application page
            </Link>
            .
          </span>
        </div>
      </div>

      <div aria-hidden className="pointer-events-none relative -mb-[3vw] mt-4 overflow-hidden">
        <div
          data-footer-word
          className="font-display text-center text-[clamp(4.2rem,16.5vw,17rem)] font-bold leading-[0.82] tracking-[-0.04em] text-[var(--color-navy-700)] [font-stretch:110%]"
        >
          SOLIDIFY
        </div>
      </div>
    </footer>
  );
}
