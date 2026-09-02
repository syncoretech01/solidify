/**
 * Builds lib/us-map.json — SVG path data for the 48 contiguous states from
 * the US Census cartographic boundaries (us-atlas, public domain), projected
 * with Albers USA. Run once; the output is committed.
 *
 *   node scripts/build-map.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { feature } from "topojson-client";
import { geoAlbersUsa, geoPath } from "d3-geo";

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const topo = JSON.parse(readFileSync(require.resolve("us-atlas/states-10m.json"), "utf8"));

const FIPS = {
  "01": "AL", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL", "13": "GA",
  "16": "ID", "17": "IL", "18": "IN", "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME", "24": "MD", "25": "MA",
  "26": "MI", "27": "MN", "28": "MS", "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH", "34": "NJ", "35": "NM",
  "36": "NY", "37": "NC", "38": "ND", "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD",
  "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI", "56": "WY",
};

const W = 975;
const H = 610;
const projection = geoAlbersUsa().scale(1300).translate([W / 2, H / 2]);
const path = geoPath(projection);

const states = feature(topo, topo.objects.states).features
  .filter((f) => FIPS[f.id] && f.id !== "11")
  .map((f) => {
    const d = path(f);
    const [cx, cy] = path.centroid(f);
    return { id: f.id, abbr: FIPS[f.id], name: f.properties.name, d: d.replace(/(\d+\.\d{2})\d+/g, "$1"), cx: +cx.toFixed(1), cy: +cy.toFixed(1) };
  })
  .sort((a, b) => a.abbr.localeCompare(b.abbr));

writeFileSync(join(ROOT, "lib", "us-map.json"), JSON.stringify({ viewBox: `0 0 ${W} ${H}`, states }));
console.log(`${states.length} states → lib/us-map.json`);
