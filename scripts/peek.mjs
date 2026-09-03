/**
 * Quick headless look at one route: screenshots at several scroll positions
 * plus console/network errors. One headless Edge, closed on exit.
 *
 *   node scripts/peek.mjs /car-shipping [width=1536] [height=864] [steps=8] [outDir=qa/peek]
 */
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const raw = process.argv[2] || "home";
const path = raw === "home" ? "/" : raw.startsWith("/") ? raw : `/${raw}`;
const W = Number(process.argv[3] || 1536);
const H = Number(process.argv[4] || 864);
const STEPS = Number(process.argv[5] || 8);
const OUT = process.argv[6] || join("qa", "peek");
const TARGET = process.env.TARGET || "http://localhost:3477";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--enable-unsafe-swiftshader", "--disable-gpu", "--mute-audio"] });
try {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, colorScheme: "dark" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 300)));
  page.on("pageerror", (e) => errors.push("pageerror: " + String(e.message).slice(0, 300)));
  page.on("response", (r) => r.status() >= 400 && r.url().startsWith(TARGET) && errors.push(`HTTP ${r.status()} ${r.url()}`));
  const t0 = Date.now();
  await page.goto(`${TARGET}${path}`, { waitUntil: "load", timeout: 180000 });
  await page.waitForTimeout(2500);
  const name = path === "/" ? "home" : path.replace(/^\//, "").replace(/[\/#?]/g, "_");
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let i = 0; i <= STEPS; i++) {
    const y = Math.round(((total - H) * i) / STEPS);
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(i === 0 ? 400 : 1100);
    await page.screenshot({ path: join(OUT, `${name}-${W}-${String(i).padStart(2, "0")}.png`) });
  }
  // back to the top: pinned sections must restore their resting state
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1400);
  await page.screenshot({ path: join(OUT, `${name}-${W}-back.png`) });
  console.log(`${path} ${W}x${H} height=${total} in ${Date.now() - t0}ms → ${OUT}/${name}-${W}-*.png`);
  if (errors.length) console.log("ERRORS:\n  " + [...new Set(errors)].join("\n  "));
  else console.log("no console/network errors");
  await ctx.close();
} finally {
  await browser.close();
}
