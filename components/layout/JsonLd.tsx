import { headers } from "next/headers";

/** Emits JSON-LD with the request nonce so the CSP admits it. */
export async function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const list = Array.isArray(data) ? data : [data];
  return (
    <>
      {list.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(d).replace(/</g, "\\u003c") }}
        />
      ))}
    </>
  );
}
