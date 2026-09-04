/**
 * The onboarding submission, rendered as one plain-text email.
 *
 * This message is the record. The website keeps no copy, so everything the
 * reviewer needs has to be here: every field the operator filled in, the
 * verbatim authorization they accepted, and the three documents attached.
 *
 * Pure. No I/O, no config, no logging — which is what makes it reviewable by
 * eye against the client's forms. NOTHING returned by this module may ever be
 * passed to `log.*`; the body carries a taxpayer identification number and a
 * bank account number in full, because that is the delivery mechanism the
 * client asked for.
 */

import type { MailAttachment } from "./mail";
import { COMPANY, ADDRESS_LINES, INSURANCE } from "@/lib/site";
import type { DirectDepositStep, EquipmentStep, InsuranceStep, ProfileStep, W9Step } from "@/lib/schemas";
import { DIRECT_DEPOSIT_AUTHORIZATION_TEXT, DIRECT_DEPOSIT_AUTHORIZATION_VERSION } from "@/lib/schemas";

export interface OnboardingPayload {
  profile: ProfileStep;
  equipment: EquipmentStep;
  insurance: InsuranceStep;
  w9: W9Step;
  "direct-deposit": DirectDepositStep;
}

export interface DeliveredFile {
  /** The client-minted id the step data refers to. */
  id: string;
  purpose: "certificate" | "w9" | "voided-check";
  /** What the uploader called it — shown in the body only, never in a filename. */
  originalName: string;
  /** From the sniffed bytes. */
  mime: string;
  bytes: number;
  buffer: Buffer;
}

const EXT: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png" };

const PURPOSE_LABEL: Record<DeliveredFile["purpose"], string> = {
  certificate: "certificate",
  w9: "w9",
  "voided-check": "voided-check",
};

const dash = (v: string | undefined | null) => (v && String(v).trim() !== "" ? String(v).trim() : "—");

const digitsOnly = (v: string) => v.replace(/\D+/g, "");

/** 987654321 → 98-7654321. Readability only; the digits are unchanged. */
const formatEin = (v: string) => {
  const d = digitsOnly(v);
  return d.length === 9 ? `${d.slice(0, 2)}-${d.slice(2)}` : v;
};

const kb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024))} KB`;

function rows(pairs: [string, string][]): string[] {
  const width = pairs.reduce((w, [k]) => Math.max(w, k.length), 0);
  return pairs.map(([k, v]) => `${k.padEnd(width)} : ${v.replace(/\r?\n/g, " ")}`);
}

function heading(n: number, title: string): string {
  const label = `── ${n}. ${title.toUpperCase()} `;
  return label + "─".repeat(Math.max(3, 72 - label.length));
}

/**
 * Attachment names are built here, from the reference and the sniffed type.
 * No byte of the uploader's filename reaches a mail client's Save-As dialog.
 */
export function attachmentName(reference: string, purpose: DeliveredFile["purpose"], mime: string, index?: number): string {
  const ext = EXT[mime] ?? "bin";
  const n = index === undefined ? "" : `-${index}`;
  return `${reference}-${PURPOSE_LABEL[purpose]}${n}.${ext}`;
}

export function buildOnboardingEmail(
  payload: OnboardingPayload,
  files: DeliveredFile[],
  reference: string,
  receivedAt: string,
): { subject: string; text: string; attachments: MailAttachment[] } {
  const p = payload.profile;
  const e = payload.equipment;
  const ins = payload.insurance;
  const dd = payload["direct-deposit"];

  const certs = files.filter((f) => f.purpose === "certificate");
  const w9 = files.find((f) => f.purpose === "w9");
  const check = files.find((f) => f.purpose === "voided-check");

  const attachments: MailAttachment[] = [];
  const named: { file: DeliveredFile; name: string }[] = [];
  certs.forEach((f, i) => named.push({ file: f, name: attachmentName(reference, "certificate", f.mime, certs.length > 1 ? i + 1 : undefined) }));
  if (w9) named.push({ file: w9, name: attachmentName(reference, "w9", w9.mime) });
  if (check) named.push({ file: check, name: attachmentName(reference, "voided-check", check.mime) });
  for (const { file, name } of named) attachments.push({ filename: name, content: file.buffer.toString("base64"), contentType: file.mime });

  const attachIndex = (f: DeliveredFile) => named.findIndex((n) => n.file === f) + 1;
  const certRef =
    certs.length === 0
      ? "—"
      : `${certs.length} attached — ${certs.map((f) => `attachment ${attachIndex(f)}`).join(", ")}\n${" ".repeat(27)}(submitted as ${certs.map((f) => `"${f.originalName}"`).join(", ")})`;

  const L: string[] = [];
  L.push(`Owner-operator onboarding — reference ${reference}`);
  L.push(`Received ${receivedAt}`);
  L.push(`Authorization ${DIRECT_DEPOSIT_AUTHORIZATION_VERSION}, accepted ${receivedAt}`);
  L.push("");
  L.push("This message is the only record of this submission. The website stored nothing.");
  L.push("");

  L.push(heading(1, "Business information"));
  L.push(
    ...rows([
      ["Company or operator name", dash(p.companyName)],
      ["Contact person", dash(p.contactPerson)],
      ["Phone", dash(p.phone)],
      ["Email", dash(p.email)],
      ["Address", `${dash(p.addressLine)}, ${dash(p.city)}, ${dash(p.state)} ${dash(p.zip)}`],
    ]),
  );
  L.push("");

  L.push(heading(2, "Equipment, licensing & service"));
  L.push(
    ...rows([
      ["Truck / Power Unit VIN", dash(e.powerUnitVin)],
      ["Truck / Power Unit", [e.year, e.make, e.model].filter(Boolean).join(" ") || "—"],
      ["Capacity", dash(e.capacity)],
      ["USDOT number", dash(e.dot)],
      ["MC number", dash(e.mc)],
      ["Primary service areas", dash(e.serviceAreas)],
      ["GPS / tracking", dash(e.gpsTracking)],
    ]),
  );
  L.push("");

  L.push(heading(3, "Insurance"));
  L.push(
    ...rows([
      ["Cargo policy", dash(ins.cargoPolicyNumber)],
      ["General liability policy", dash(ins.generalLiabilityPolicyNumber)],
      ["Auto liability policy", dash(ins.autoLiabilityPolicyNumber)],
      ["Agent", `${dash(ins.agentName)} · ${dash(ins.agentEmail)} · ${dash(ins.agentPhone)}`],
      ["Requirements confirmed", ins.acknowledgedLimits ? "Yes — holder, additional insured, agent-issued, limits" : "No"],
      ["Certificates", certRef],
    ]),
  );
  L.push("");
  L.push("  Required minimums:");
  for (const r of INSURANCE.requirements) L.push(`    ${r.label} — ${r.note.toLowerCase()}: ${r.limit}`);
  L.push(`  Certificate holder and additional insured: ${INSURANCE.certificateHolder.join(", ")}`);
  L.push("");

  L.push(heading(4, "Form W-9"));
  L.push(
    ...rows([
      ["Complete and signed", payload.w9.w9Confirmed ? "Confirmed by the operator" : "Not confirmed"],
      ["W-9", w9 ? `attachment ${attachIndex(w9)} (submitted as "${w9.originalName}")` : "—"],
    ]),
  );
  L.push("");

  L.push(heading(5, "Direct deposit authorization"));
  L.push("  Payer (as printed on the form):");
  L.push(`    ${COMPANY.legalName} · ${ADDRESS_LINES.join(" · ")} · ${COMPANY.phone}`);
  L.push("");
  L.push(
    ...rows([
      ["Payee / company name", dash(dd.payeeName)],
      ["Payee address", [dd.payeeAddressLine, dd.payeeCity, dd.payeeState, dd.payeeZip].filter(Boolean).join(", ") || "—"],
      ["Payee phone", dash(dd.payeePhone)],
      ["Payee MC", dash(dd.payeeMc)],
      ["EIN / TIN", formatEin(dd.ein)],
      ["Financial institution", dash(dd.bankName)],
      ["Institution address", [dd.bankAddressLine, dd.bankCity, dd.bankState, dd.bankZip].filter(Boolean).join(", ") || "—"],
      ["Institution phone", dash(dd.bankPhone)],
      ["Institution fax", dash(dd.bankFax)],
      ["Routing number", digitsOnly(dd.routingNumber)],
      ["Account number", digitsOnly(dd.accountNumber)],
      ["Type of account", dd.accountType === "checking" ? "Checking" : "Savings"],
      ["Amount to deposit", "100%"],
      ["Voided check", check ? `attachment ${attachIndex(check)} (submitted as "${check.originalName}")` : "—"],
    ]),
  );
  L.push("");
  L.push(`  Authorization accepted verbatim (version ${DIRECT_DEPOSIT_AUTHORIZATION_VERSION}):`);
  const quoted = wrap(DIRECT_DEPOSIT_AUTHORIZATION_TEXT, 68);
  quoted.forEach((line, i) => {
    const open = i === 0 ? '"' : " ";
    const close = i === quoted.length - 1 ? '"' : "";
    L.push(`    ${open}${line}${close}`);
  });
  L.push("");
  L.push(
    ...rows([
      ["By (typed full name)", dash(dd.signatureName)],
      ["Date", dash(dd.signatureDate)],
    ]),
  );
  L.push("");

  L.push(heading(6, "Attachments"));
  if (named.length === 0) L.push("  none");
  for (const [i, { file, name }] of named.entries()) {
    L.push(`  ${i + 1}  ${name.padEnd(46)} ${file.mime.padEnd(17)} ${kb(file.bytes)}`);
  }
  L.push("");
  L.push("CONFIDENTIAL — this message contains a taxpayer identification number and");
  L.push("bank account details. Sent by the Solidify Transport website. The website");
  L.push("kept no copy.");

  return {
    subject: `[Solidify] Owner-operator onboarding — ${p.companyName} — ${reference}`,
    text: L.join("\n"),
    attachments,
  };
}

/** Soft-wrap the authorization so it reads as a quoted block in a mail client. */
function wrap(s: string, width: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const word of s.split(/\s+/)) {
    if (line.length + word.length + 1 > width) {
      out.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) out.push(line);
  return out;
}
