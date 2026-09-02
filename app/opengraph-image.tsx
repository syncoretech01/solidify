import { ImageResponse } from "next/og";
import { COMPANY, CLAIMS } from "@/lib/site";

export const alt = `${COMPANY.name} — ${COMPANY.descriptor}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(160deg, #142038 0%, #070c16 60%, #04070d 100%)",
          color: "#f2f5f9",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "#1f55e0", display: "flex" }} />
          <div style={{ fontSize: 30, letterSpacing: 6, fontWeight: 700 }}>SOLIDIFY TRANSPORT</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2, maxWidth: 980 }}>
            Nationwide auto transport, carrier-direct.
          </div>
          <div style={{ fontSize: 30, color: "#b4bfcc", maxWidth: 900, lineHeight: 1.3 }}>
            {`${COMPANY.descriptor} · ${CLAIMS.coverage} · ${CLAIMS.focus}`}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#8c97a6" }}>
          <div>OEMs · Dealerships · Consumers · Owner-Operators</div>
          <div>{COMPANY.phone}</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
