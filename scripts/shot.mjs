/**
 * Quick headless screenshot helper (Edge via playwright-core, never a visible window).
 *   node scripts/shot.mjs <url> <out.png> [width] [height] [fullPage=0] [scrollTo=0]
 */
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const [url, out, w = "1536", h = "864", full = "0", scrollY = "0"] = process.argv.slice(2);
mkdirSync(dirname(out), { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--enable-unsafe-swiftshader", "--disable-gpu", "--mute-audio"] });
try {
  const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message.slice(0, 200)));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text().slice(0, 200)); });
  await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(1800);
  if (+scrollY) {
    await page.evaluate(async (y) => { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 900)); }, +scrollY);
  }
  await page.screenshot({ path: out, fullPage: full === "1" });
  const info = await page.evaluate(() => ({ docH: document.documentElement.scrollHeight, docW: document.documentElement.scrollWidth, winW: innerWidth }));
  console.log(JSON.stringify({ out, ...info, errors: [...new Set(errors)].slice(0, 8) }, null, 2));
  await ctx.close();
} finally {
  await browser.close();
}
