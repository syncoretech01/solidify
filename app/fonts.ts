import { Archivo, Inter, IBM_Plex_Mono } from "next/font/google";

/**
 * The Solidify type system.
 *
 * Archivo        — display. A strong modern grotesk with a width axis; set
 *                  wide and tight at headline sizes, it carries the
 *                  automotive-industrial register of the brand.
 * Inter          — body and UI. Excellent readability at every size.
 * IBM Plex Mono  — metadata only: eyebrows, reference numbers. Never body copy.
 *
 * All self-hosted by next/font — no third-party font origin at runtime, which
 * is what lets the CSP keep font-src to 'self'.
 */

export const archivo = Archivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-archivo",
  weight: "variable",
  axes: ["wdth"],
  preload: true,
});

export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
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

export const fontVariables = `${archivo.variable} ${inter.variable} ${plexMono.variable}`;
