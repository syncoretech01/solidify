/**
 * Outbound mail for INQUIRIES ONLY. The onboarding pipeline never imports
 * this module; a TIN or bank number must never sit in a mailbox.
 *
 * Resend REST API via fetch. No SDK.
 */

import type { Inquiry } from "@/lib/schemas";
import { getConfig } from "./config";

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}

export interface Mailer {
  send(msg: MailMessage): Promise<{ id: string | null }>;
}

class ResendMailer implements Mailer {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(msg: MailMessage): Promise<{ id: string | null }> {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${this.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: this.from,
        to: [msg.to],
        subject: msg.subject,
        text: msg.text,
        ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      let detail = "";
      try {
        const body = (await res.json()) as { message?: string; name?: string };
        detail = body.message ?? body.name ?? "";
      } catch {
        /* body not JSON */
      }
      throw new Error(`resend responded ${res.status}${detail ? `: ${detail}` : ""}`);
    }
    const body = (await res.json()) as { id?: string };
    return { id: typeof body.id === "string" ? body.id : null };
  }
}

let mailer: Mailer | null | undefined;

export function getMailer(): Mailer | null {
  if (mailer !== undefined) return mailer;
  const cfg = getConfig();
  mailer = cfg.mailConfigured && cfg.resendApiKey ? new ResendMailer(cfg.resendApiKey, cfg.inquiryFromEmail) : null;
  return mailer;
}

const LANE_LABEL: Record<Inquiry["lane"], string> = {
  vehicle: "Vehicle shipping quote",
  oem: "OEM / dealership inquiry",
  operator: "Owner-operator inquiry",
};

const FIELD_LABEL: Record<string, string> = {
  pickupCity: "Pickup city",
  pickupState: "Pickup state",
  deliveryCity: "Delivery city",
  deliveryState: "Delivery state",
  vehicleYear: "Vehicle year",
  vehicleMake: "Vehicle make",
  vehicleModel: "Vehicle model",
  operable: "Operable",
  preferredDate: "Preferred date",
  name: "Name",
  phone: "Phone",
  email: "Email",
  notes: "Notes",
  company: "Company",
  role: "Role",
  orgType: "Organization type",
  originRegion: "Origin region",
  destinationRegion: "Destination region",
  volume: "Approximate volume",
  homeBase: "Home base",
  equipment: "Equipment",
};

/** Plain-text body. Fields in schema order, blanks omitted, anti-spam fields dropped. */
export function formatInquiryEmail(inquiry: Inquiry, reference: string, receivedAt: string): { subject: string; text: string } {
  const lines: string[] = [];
  lines.push(`${LANE_LABEL[inquiry.lane]} — reference ${reference}`);
  lines.push(`Received ${receivedAt}`);
  lines.push("");
  for (const [key, value] of Object.entries(inquiry)) {
    if (key === "lane" || key === "website" || key === "startedAt") continue;
    if (value === undefined || value === null || String(value).trim() === "") continue;
    const label = FIELD_LABEL[key] ?? key;
    const text = String(value).replace(/\r?\n/g, "\n    ");
    lines.push(`${label}: ${text}`);
  }
  lines.push("");
  lines.push("Sent by the Solidify Transport website inquiry form.");
  return {
    subject: `[Solidify] ${LANE_LABEL[inquiry.lane]} — ${inquiry.name} (${reference})`,
    text: lines.join("\n"),
  };
}
