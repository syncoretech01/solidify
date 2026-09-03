/**
 * Renders the Blueprint views to PNG so the drawing can be judged by eye.
 *   node scripts/blueprint-preview.mjs [outDir]
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { BLUEPRINT_PATHS, BLUEPRINT_CALLOUTS, BLUEPRINT_VIEWS } from "../lib/blueprint.data.mjs";

const out = process.argv[2] ?? join(process.cwd(), ".audit", "blueprint");
mkdirSync(out, { recursive: true });

function render(viewKey) {
  const v = BLUEPRINT_VIEWS[viewKey];
  const hide = new Set(v.hide ?? []);
  const hot = (p) => (v.highlight?.vehicles?.includes(p.vehicle) || v.highlight?.groups?.includes(p.group)) ?? false;
  const paths = BLUEPRINT_PATHS.filter((p) => !hide.has(p.group) && (p.id !== "pin" || v.showPin) && (viewKey === "iconRows" ? (p.vehicle ?? 0) >= 9 || p.id === "ground-ext" : (p.vehicle ?? 0) < 9 && p.id !== "ground-ext"))
    .map(
      (p) =>
        `<path d="${p.d}" stroke="${hot(p) ? "#b3d4ff" : "#c8cfd8"}" stroke-width="${hot(p) ? 1.9 : p.group === "tick" || p.group === "structure" ? 0.9 : 1.25}" ${p.group === "tick" ? 'stroke-dasharray="3 5"' : ""} opacity="${p.group === "structure" || p.group === "tick" ? 0.7 : 1}" fill="${p.fill ? "rgba(255,255,255,0.035)" : "none"}"/>`,
    )
    .join("\n");
  const callouts = v.callouts
    ? BLUEPRINT_CALLOUTS.map(
        (c) =>
          `<path d="${c.leader}" stroke="#8b95a4" stroke-width="0.9" stroke-dasharray="3 4" fill="none"/><text x="${c.x}" y="${c.y}" text-anchor="${c.anchor}" font-family="monospace" font-size="13" letter-spacing="1.8" fill="#8b95a4">${c.text}</text>`,
      ).join("\n")
    : "";
  const [, , w, h] = v.viewBox.split(" ").map(Number);
  const W = 1600;
  const H = Math.round((W * h) / w);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${v.viewBox}"><rect x="-5000" y="-5000" width="10000" height="10000" fill="#14171c"/><g stroke-linecap="round" stroke-linejoin="round">${paths}</g>${callouts}</svg>`;
}

for (const key of Object.keys(BLUEPRINT_VIEWS)) {
  const svg = render(key);
  const file = join(out, `${key}.png`);
  await sharp(Buffer.from(svg)).png().toFile(file);
  console.log("  ", file);
}
