/**
 * Blueprint — one stylised technical elevation of a loaded auto hauler,
 * expressed as path data so it can be drawn (DrawSVG), cropped (viewBox
 * views) and highlighted. Plain ESM so the preview script and the React
 * component share the same source. Coordinates in a 1600×560 box; ground at
 * y=470. Nothing here is a claim about Solidify's equipment — it is a drawing
 * of the kind of machine the business runs on.
 */

export const BLUEPRINT_VIEWBOX = "0 0 1600 560";

const GROUND = 470;

/* A car silhouette sitting on a deck line `y`, nose to the left. */
function car(id, x, y, len = 228, h = 66) {
  const wr = 20;
  const wy = y - wr;
  const fx = x + 44; // front wheel centre x
  const rx = x + len - 44; // rear wheel centre x
  const body = [
    `M ${x + 6} ${y - 24}`,
    `L ${x + 4} ${y - 40}`,
    `Q ${x + 6} ${y - 52} ${x + 20} ${y - 54}`, // nose
    `L ${x + 68} ${y - 56}`, // hood
    `L ${x + 96} ${y - h - 4}`, // windshield
    `L ${x + len - 92} ${y - h - 8}`, // roof
    `Q ${x + len - 60} ${y - h - 6} ${x + len - 40} ${y - 58}`, // rear glass
    `L ${x + len - 8} ${y - 52}`,
    `Q ${x + len} ${y - 48} ${x + len - 2} ${y - 36}`,
    `L ${x + len - 4} ${y - 24}`, // rear bumper
    `L ${rx + wr + 6} ${y - 22}`,
    `A ${wr + 6} ${wr + 6} 0 0 0 ${rx - wr - 6} ${y - 22}`, // rear arch
    `L ${fx + wr + 6} ${y - 22}`,
    `A ${wr + 6} ${wr + 6} 0 0 0 ${fx - wr - 6} ${y - 22}`, // front arch
    `Z`,
  ].join(" ");
  const glass = `M ${x + 96} ${y - 56} L ${x + len - 44} ${y - 56} M ${x + 122} ${y - 56} L ${x + 126} ${y - 26}`;
  const wheel = (cx) => `M ${cx - wr} ${wy} a ${wr} ${wr} 0 1 0 ${wr * 2} 0 a ${wr} ${wr} 0 1 0 ${-wr * 2} 0 M ${cx - 8} ${wy} a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0`;
  return [
    { id: `${id}-body`, d: body, group: "vehicle", vehicle: id, fill: true },
    { id: `${id}-glass`, d: glass, group: "vehicle", vehicle: id },
    { id: `${id}-wf`, d: wheel(fx), group: "vehicle", vehicle: id },
    { id: `${id}-wr`, d: wheel(rx), group: "vehicle", vehicle: id },
  ];
}

const circle = (cx, cy, r) => `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`;

/* ---------------------------------------------------------------- truck */
const truck = [
  // hood + cab + sleeper outline
  {
    id: "cab",
    group: "truck",
    d: "M 70 470 L 70 330 Q 70 300 100 298 L 236 292 L 250 214 Q 254 202 266 202 L 400 200 L 400 194 L 520 194 Q 532 194 532 206 L 532 400 L 604 400 L 604 470",
  },
  { id: "cab-base", group: "truck", d: "M 70 470 L 604 470" },
  { id: "windshield", group: "truck", d: "M 262 292 L 272 226 L 396 226 L 396 292 Z" },
  { id: "door", group: "truck", d: "M 300 300 L 300 440 M 300 300 L 396 300 L 396 440" },
  { id: "door-handle", group: "truck", d: "M 372 358 L 388 358" },
  { id: "sleeper-window", group: "truck", d: "M 430 226 L 500 226 L 500 270 L 430 270 Z" },
  { id: "grille", group: "truck", d: "M 84 320 L 84 400 M 96 320 L 96 400 M 108 320 L 108 400 M 120 320 L 120 400 M 78 360 L 128 360" },
  { id: "bumper", group: "truck", d: "M 60 420 L 240 420 L 240 448 L 60 448 Z" },
  { id: "hood-line", group: "truck", d: "M 100 298 L 236 292 L 236 420" },
  { id: "step", group: "truck", d: "M 300 430 L 396 430 L 396 452 L 300 452" },
  { id: "tank", group: "truck", d: "M 410 404 Q 410 392 422 392 L 536 392 Q 548 392 548 404 L 548 440 Q 548 452 536 452 L 422 452 Q 410 452 410 440 Z" },
  { id: "exhaust", group: "truck", d: "M 540 200 L 540 330" },
  { id: "mirror", group: "truck", d: "M 250 236 L 232 236 L 232 268 L 250 268" },
  // head-rack over the cab: a deck at y=150 on posts
  { id: "headrack-deck", group: "deck", d: "M 232 152 L 560 148" },
  { id: "headrack-post-1", group: "upright", d: "M 244 152 L 244 300" },
  { id: "headrack-post-2", group: "upright", d: "M 548 150 L 548 400" },
  { id: "headrack-brace", group: "structure", d: "M 244 220 L 548 190" },
];

/* --------------------------------------------------------------- trailer */
const trailer = [
  // stinger / lower frame
  { id: "stinger", group: "deck", d: "M 604 430 L 640 430 L 660 400" },
  { id: "lower-deck", group: "deck", d: "M 600 400 L 1516 396" },
  { id: "lower-deck-2", group: "deck", d: "M 600 410 L 1516 406" },
  { id: "upper-deck", group: "deck", d: "M 560 236 L 1524 226" },
  { id: "upper-deck-2", group: "deck", d: "M 560 246 L 1524 236" },
  // uprights with hydraulic cylinders
  { id: "upright-1", group: "upright", d: "M 720 236 L 720 400 M 730 250 L 730 386" },
  { id: "upright-2", group: "upright", d: "M 990 234 L 990 398 M 1000 248 L 1000 384" },
  { id: "upright-3", group: "upright", d: "M 1250 231 L 1250 397 M 1260 245 L 1260 383" },
  { id: "upright-4", group: "upright", d: "M 1512 228 L 1512 396" },
  // structure / bracing
  { id: "brace-1", group: "structure", d: "M 720 400 L 990 300 M 990 398 L 1250 300" },
  { id: "brace-2", group: "structure", d: "M 1250 397 L 1512 300" },
  { id: "frame-rail", group: "structure", d: "M 660 440 L 1540 440" },
  // rear ramps (lower deck to ground, upper deck folded)
  { id: "ramp-lower", group: "ramp", d: "M 1516 400 L 1592 468 M 1516 410 L 1592 476" },
  { id: "ramp-upper", group: "ramp", d: "M 1524 228 L 1572 262 M 1524 238 L 1572 272" },
  { id: "ramp-foot", group: "ramp", d: "M 1584 468 L 1600 468" },
];

/* ---------------------------------------------------------------- wheels */
const wheels = [
  { id: "w-front", group: "wheel", d: `${circle(160, 432, 38)} ${circle(160, 432, 16)}` },
  { id: "w-drive-1", group: "wheel", d: `${circle(470, 432, 38)} ${circle(470, 432, 16)}` },
  { id: "w-drive-2", group: "wheel", d: `${circle(560, 432, 38)} ${circle(560, 432, 16)}` },
  { id: "w-trailer-1", group: "wheel", d: `${circle(1380, 434, 36)} ${circle(1380, 434, 15)}` },
  { id: "w-trailer-2", group: "wheel", d: `${circle(1462, 434, 36)} ${circle(1462, 434, 15)}` },
];

/* --------------------------------------------------------------- vehicles */
const vehicles = [
  ...car(1, 262, 150, 236), // over the cab
  ...car(2, 580, 236, 228),
  ...car(3, 828, 234, 228),
  ...car(4, 1076, 232, 228),
  ...car(5, 1324, 230, 196, 60),
  ...car(6, 660, 400, 228),
  ...car(7, 908, 399, 228),
  ...car(8, 1156, 398, 228),
  // icon rows (outside the full view)
  ...car(9, 1720, 200, 200, 58),
  ...car(10, 1720, 320, 200, 58),
  ...car(11, 1720, 440, 200, 58),
];

/* ---------------------------------------------------------------- ground */
const ground = [
  { id: "ground", group: "ground", d: `M 20 ${GROUND} L 1600 ${GROUND}` },
  { id: "ground-ext", group: "ground", d: `M 1700 500 L 1930 500` },
];

/* ----------------------------------------------------------------- ticks */
const ticks = [
  { id: "dim-line", group: "tick", d: "M 70 512 L 1592 512" },
  { id: "dim-t1", group: "tick", d: "M 70 504 L 70 520" },
  { id: "dim-t2", group: "tick", d: "M 604 504 L 604 520" },
  { id: "dim-t3", group: "tick", d: "M 1592 504 L 1592 520" },
  { id: "dim-v", group: "tick", d: "M 40 150 L 40 470 M 32 150 L 48 150 M 32 470 L 48 470" },
  { id: "pin", group: "structure", d: "M 1560 350 a 14 14 0 1 1 28 0 c 0 12 -14 26 -14 26 s -14 -14 -14 -26 z M 1574 350 m -5 0 a 5 5 0 1 0 10 0 a 5 5 0 1 0 -10 0" },
];

export const BLUEPRINT_PATHS = [...truck, ...trailer, ...wheels, ...vehicles, ...ground, ...ticks];

export const BLUEPRINT_CALLOUTS = [
  { id: "c-power", text: "POWER UNIT", x: 330, y: 540, anchor: "middle", leader: "M 330 470 L 330 522" },
  { id: "c-upper", text: "UPPER DECK", x: 1064, y: 60, anchor: "middle", leader: "M 1064 232 L 1064 72" },
  { id: "c-upright", text: "HYDRAULIC UPRIGHT", x: 1272, y: 308, anchor: "start", leader: "M 1250 300 L 1264 300" },
  { id: "c-ramp", text: "RAMP", x: 1556, y: 540, anchor: "middle", leader: "M 1556 472 L 1556 522" },
];

export const BLUEPRINT_VIEWS = {
  full: { viewBox: "0 0 1600 560", callouts: true },
  transit: { viewBox: "0 0 1600 560", callouts: false, hide: ["tick", "ground"] },
  deck: { viewBox: "600 140 700 320", callouts: false, hide: ["tick"] },
  ramp: { viewBox: "1040 150 570 400", callouts: false, highlight: { vehicles: [8], groups: ["ramp"] }, hide: ["tick"] },
  delivery: { viewBox: "1040 150 570 400", callouts: false, highlight: { vehicles: [8], groups: ["ramp", "pin"] }, hide: ["tick"], showPin: true },
  cab: { viewBox: "20 60 640 500", callouts: false, hide: ["tick"] },
  iconCar: { viewBox: "570 160 250 90", callouts: false, hide: ["tick", "ground", "deck", "upright", "structure", "ramp", "wheel", "truck"] },
  iconRows: { viewBox: "1705 130 230 380", callouts: false, hide: ["tick", "deck", "upright", "structure", "ramp", "wheel", "truck"] },
  iconHauler: { viewBox: "20 120 1600 380", callouts: false, hide: ["tick", "ground"] },
};

/** Draw order: the machine first, then the load, then the marks. */
export const BLUEPRINT_ORDER = ["truck", "deck", "upright", "structure", "ramp", "wheel", "vehicle", "ground", "tick"];
