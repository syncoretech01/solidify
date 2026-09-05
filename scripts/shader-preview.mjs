/**
 * SOLIDIFY — shader preview.
 *
 *   node scripts/shader-preview.mjs [out=.audit/shaders.png] [w=640] [h=400]
 *
 * Pulls the three ambient fragment programs straight out of
 * components/webgl/Field.tsx and the shared GLSL out of lib/webgl/surface.ts,
 * renders each one on a real WebGL2 context in headless Edge, and tiles the
 * results into one PNG.
 *
 * This exists because the alternative — screenshotting a whole page to find
 * out whether a background is too dark to see — costs a build, a server and a
 * page load per iteration, and shows the shader through a photograph, a scrim
 * and a section background. Here it is the shader and nothing else.
 */
import { chromium } from "playwright-core";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = process.argv[2] || ".audit/shaders.png";
const W = Number(process.argv[3] || 640);
const H = Number(process.argv[4] || 400);

const field = readFileSync("components/webgl/Field.tsx", "utf8");
const surface = readFileSync("lib/webgl/surface.ts", "utf8");

const between = (src, startMark, endMark, label) => {
  const a = src.indexOf(startMark);
  if (a < 0) throw new Error(`could not find ${label}`);
  const b = src.indexOf(endMark, a + startMark.length);
  if (b < 0) throw new Error(`could not close ${label}`);
  return src.slice(a + startMark.length, b);
};

const COMMON = between(surface, "export const GLSL_COMMON = `", "`;", "GLSL_COMMON");
const HEAD = between(field, "const HEAD = `", "`;", "HEAD").replace("${GLSL_COMMON}", COMMON);
const pick = (name) => between(field, `const ${name} = \`\${HEAD}`, "`;", name);

const SHADERS = [
  { name: "transit", src: HEAD + pick("TRANSIT") },
  { name: "network", src: HEAD + pick("NETWORK") },
  { name: "dusk", src: HEAD + pick("DUSK") },
];

const VERT = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: W, height: H * SHADERS.length + 28 * SHADERS.length } });

/* A dark ground behind each canvas, so what is judged is what the section
   actually shows: the shader composited over the site's own surface. */
await page.setContent(`<!doctype html><html><body style="margin:0;background:#0b0f18;font:12px monospace;color:#b3d4ff">
${SHADERS.map((s) => `<div style="padding:6px 8px">${s.name}</div><canvas id="c-${s.name}" width="${W}" height="${H}" style="display:block;width:${W}px;height:${H}px;background:#14171c"></canvas>`).join("")}
</body></html>`);

const errors = await page.evaluate(
  ({ shaders, vert, W, H }) => {
    const errs = [];
    for (const s of shaders) {
      const canvas = document.getElementById("c-" + s.name);
      const gl = canvas.getContext("webgl2", { alpha: true, antialias: false, premultipliedAlpha: true });
      if (!gl) {
        errs.push(s.name + ": no webgl2");
        continue;
      }
      const mk = (type, src) => {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
          errs.push(s.name + ": " + gl.getShaderInfoLog(sh));
          return null;
        }
        return sh;
      };
      const vs = mk(gl.VERTEX_SHADER, vert);
      const fs = mk(gl.FRAGMENT_SHADER, s.src);
      if (!vs || !fs) continue;
      const prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        errs.push(s.name + ": link " + gl.getProgramInfoLog(prog));
        continue;
      }
      gl.bindVertexArray(gl.createVertexArray());
      gl.useProgram(prog);
      const u = (n) => gl.getUniformLocation(prog, n);
      gl.uniform2f(u("uRes"), W, H);
      gl.uniform2f(u("uPointer"), 0.25, 0.15);
      gl.uniform1f(u("uTime"), 8.0);
      gl.uniform1f(u("uScroll"), 0.35);
      gl.uniform1f(u("uIntensity"), 1.0);
      gl.viewport(0, 0, W, H);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // must match lib/webgl/surface.ts
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    return errs;
  },
  { shaders: SHADERS, vert: VERT, W, H },
);

if (errors.length) {
  console.error("SHADER ERRORS:");
  for (const e of errors) console.error("  " + e);
}

mkdirSync(join(OUT, ".."), { recursive: true });
const buf = await page.screenshot({ fullPage: true });
writeFileSync(OUT, buf);
await browser.close();
console.log(`wrote ${OUT}${errors.length ? " (with shader errors above)" : ""}`);
