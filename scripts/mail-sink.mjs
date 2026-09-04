/**
 * A local stand-in for the mail provider.
 *
 * The site's only route to "submitted" is a 2xx from the mail API, so testing
 * the configured path needs something that answers like one. This does, and
 * writes each message to .data/mail/ so the smoke test can assert on what was
 * actually delivered — including that no plaintext secret escaped into a log.
 *
 *   node scripts/mail-sink.mjs [port=3479] [--fail]
 *
 * --fail answers 502 to every send, which is how the delivery-failure phase
 * proves the site never reports a success it did not receive.
 */

import { createServer } from "node:http";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const port = Number(process.argv.find((a) => /^\d+$/.test(a)) ?? process.env.MAIL_SINK_PORT ?? 3479);
const failing = process.argv.includes("--fail");
const OUT = join(process.cwd(), ".data", "mail");

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

let n = 0;

const server = createServer((req, res) => {
  if (req.method !== "POST" || !req.url?.endsWith("/emails")) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ message: "not found" }));
    return;
  }
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    if (failing) {
      res.writeHead(502, { "content-type": "application/json" });
      res.end(JSON.stringify({ message: "sink refusing on purpose" }));
      return;
    }
    const id = `sink-${++n}`;
    try {
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      writeFileSync(join(OUT, `${id}.json`), JSON.stringify(body, null, 2));
    } catch {
      writeFileSync(join(OUT, `${id}.raw`), Buffer.concat(chunks));
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ id }));
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`mail sink on http://127.0.0.1:${port} → ${OUT}${failing ? " (failing on purpose)" : ""}`);
});
