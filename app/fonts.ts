import { Inter_Tight, Manrope, IBM_Plex_Mono } from "next/font/google";

/**
 * The Solidify type system.
 *
 * Inter Tight   — display. A tight, modern grotesk that holds its shape at
 *                 medium weights, which is where this brand sets headlines.
 *                 No width axis: display type is never stretched.
 * Manrope       — body and UI. Slightly rounder than a neutral grotesk, which
 *                 keeps long-form copy from reading as a system dialog.
 * IBM Plex Mono — functional metadata only: progress readouts, spec values,
 *                 section marks. Never body copy, never decoration.
 *
 * All self-hosted by next/font — no third-party font origin at runtime, which
 * is what lets the CSP keep font-src to 'self'.
 */

export const interTight = Inter_Tight({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display-face",
  weight: "variable",
  preload: true,
});

export const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
  weight: "variable",
  preload: true,
});

export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plex-mono",
  weight: ["400", "500"],
  preload: false,
});

export const fontVariables = `${interTight.variable} ${manrope.variable} ${plexMono.variable}`;
