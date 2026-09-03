/**
 * Headless UI check for the onboarding stepper against a CONFIGURED server.
 *
 *   SMOKE_ACCESS_CODE=<code> node scripts/onboarding-ui.mjs [http://localhost:3477]
 *
 * One headless Edge, one page. Proves: the gate unlocks with the real code,
 * step controls become enabled, a step saves and the rail reflects it,
 * secrets stay type="text" + masked, nothing lands in browser storage, and
 * ending the session locks the UI again. Exit 1 on any failure.
 */
import { chromium } from "playwright-core";

const BASE = (process.argv[2] || "http://localhost:3477").replace(/\/$/, "");
const CODE = process.env.SMOKE_ACCESS_CODE || "";
if (!CODE) {
  console.error("SMOKE_ACCESS_CODE is required");
  process.exit(2);
}

let passed = 0;
let failed = 0;
const check = (name, ok, detail = "") => {
  if (ok) passed++;
  else failed++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${!ok && detail ? "\n          " + String(detail).slice(0, 400) : ""}`);
};

let browser;
try {
  browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--disable-gpu", "--mute-audio"] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 200)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));

  await page.goto(`${BASE}/owner-operators#onboarding`, { waitUntil: "load", timeout: 120000 });
  await page.waitForSelector("[data-onboarding-gate] input[name=code]", { timeout: 30000 });
  await page.waitForTimeout(1500);

  const before = await page.evaluate(() => ({
    unlocked: !!document.querySelector("[data-onboarding-unlocked]"),
    inputs: [...document.querySelectorAll("[data-onboarding-steps] input, [data-onboarding-steps] select, [data-onboarding-steps] textarea")].length,
    disabled: [...document.querySelectorAll("[data-onboarding-steps] input, [data-onboarding-steps] select, [data-onboarding-steps] textarea")].every((i) => i.disabled),
  }));
  check("locked before unlock; all step controls disabled", !before.unlocked && before.inputs > 3 && before.disabled, JSON.stringify(before));

  await page.fill("[data-onboarding-gate] input[name=code]", CODE);
  await page.click("[data-onboarding-gate] button[type=submit]");
  await page.waitForSelector("[data-onboarding-unlocked]", { timeout: 20000 });
  await page.waitForTimeout(800);
  const after = await page.evaluate(() => ({
    unlocked: !!document.querySelector("[data-onboarding-unlocked]"),
    enabled: [...document.querySelectorAll("[data-onboarding-steps] input, [data-onboarding-steps] select, [data-onboarding-steps] textarea")].filter((i) => !i.disabled).length,
    status: document.querySelector("[data-onboarding-status]")?.textContent?.trim().slice(0, 160),
    ls: Object.keys(localStorage).length,
    ss: Object.keys(sessionStorage).length,
  }));
  check("real code unlocks the stepper", after.unlocked && after.enabled > 3, JSON.stringify(after));
  check("nothing in localStorage/sessionStorage after unlock", after.ls === 0 && after.ss === 0, JSON.stringify(after));

  // Fill the profile step.
  const fill = async (sel, val) => {
    const el = await page.$(sel);
    if (!el) throw new Error(`missing ${sel}`);
    await el.fill(val);
  };
  await fill("[data-onboarding-steps] input[name=companyName]", "UI Check Carrier LLC");
  await fill("[data-onboarding-steps] input[name=contactPerson]", "Casey Check");
  await fill("[data-onboarding-steps] input[name=phone]", "5105550123");
  await fill("[data-onboarding-steps] input[name=email]", "ui-check@example.com");
  await fill("[data-onboarding-steps] input[name=addressLine]", "2 Test Way");
  await fill("[data-onboarding-steps] input[name=city]", "Tracy");
  await page.selectOption("[data-onboarding-steps] select[name=state]", "CA");
  await fill("[data-onboarding-steps] input[name=zip]", "95304");
  await page.click("[data-onboarding-steps] button[type=submit]");
  await page.waitForTimeout(2500);
  const saved = await page.evaluate(() => ({
    rail: [...document.querySelectorAll("[data-onboarding-steps] button, [data-onboarding-steps] li")].map((b) => b.textContent?.replace(/\s+/g, " ").trim()).filter((t) => /profile/i.test(t || "")).join(" | ").slice(0, 200),
    heading: document.querySelector("[data-onboarding-steps] h3, [data-onboarding-steps] h4")?.textContent?.trim().slice(0, 80),
    status: document.querySelector("[data-onboarding-status]")?.textContent?.trim().slice(0, 160),
  }));
  check("profile step saves and the rail marks it Saved", /saved/i.test(saved.rail) || /saved/i.test(saved.status || ""), JSON.stringify(saved));
  check("stepper advanced to the equipment step", /equipment|truck|power unit/i.test(saved.heading || ""), JSON.stringify(saved));

  // Jump to direct deposit and inspect the secret inputs.
  const ddBtn = await page.$("[data-onboarding-steps] button:has-text('Direct deposit')");
  if (ddBtn) {
    await ddBtn.click();
    await page.waitForTimeout(800);
    const secrets = await page.evaluate(() =>
      ["ein", "accountNumber", "routingNumber"].map((n) => {
        const el = document.querySelector(`[data-onboarding-steps] [name=${n}]`);
        return el ? { n, type: el.getAttribute("type"), masked: el.classList.contains("is-masked"), inputmode: el.getAttribute("inputmode"), autocomplete: el.getAttribute("autocomplete") } : { n, missing: true };
      }),
    );
    const ein = secrets.find((s) => s.n === "ein");
    const acct = secrets.find((s) => s.n === "accountNumber");
    const rout = secrets.find((s) => s.n === "routingNumber");
    check("EIN and account inputs are type=text, masked, numeric, autocomplete off", !!ein && !!acct && [ein, acct].every((s) => s.type === "text" && s.masked && s.inputmode === "numeric" && s.autocomplete === "off"), JSON.stringify(secrets));
    check("routing number is unmasked numeric text", !!rout && rout.type === "text" && !rout.masked, JSON.stringify(rout));
    check("no password-type inputs anywhere in onboarding", (await page.$$("[data-onboarding] input[type=password]")).length === 0);
  } else {
    check("direct deposit rail button present", false);
  }

  // End the session → locked again.
  const end = await page.$("[data-onboarding-session] button:has-text('End session')");
  if (end) {
    await end.click();
    await page.waitForTimeout(600);
    const anyway = await page.$("[data-onboarding-session] button:has-text('End anyway')");
    if (anyway) await anyway.click();
    await page.waitForTimeout(1500);
  }
  const ended = await page.evaluate(() => ({
    unlocked: !!document.querySelector("[data-onboarding-unlocked]"),
    gate: !!document.querySelector("[data-onboarding-gate] input[name=code]"),
    disabled: [...document.querySelectorAll("[data-onboarding-steps] input, [data-onboarding-steps] select, [data-onboarding-steps] textarea")].every((i) => i.disabled),
  }));
  check("ending the session locks the stepper again", !ended.unlocked && ended.gate && ended.disabled, JSON.stringify(ended));
  check("no console/page errors", errors.length === 0, errors.join(" | "));
  await ctx.close();
} catch (err) {
  console.error("harness error:", err?.stack || err);
  failed++;
} finally {
  try {
    if (browser) await browser.close();
  } catch {}
}
console.log(`\n  ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
