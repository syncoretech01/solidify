import { DIRECT_DEPOSIT_AUTHORIZATION_TEXT, DIRECT_DEPOSIT_AUTHORIZATION_VERSION, type OnboardingStep } from "@/lib/schemas";
import type { Result, UploadPurpose } from "@/lib/onboarding-client";

/* ── Steps ──────────────────────────────────────────────────────────────── */

export type StepKey = OnboardingStep | "review";

export const STEP_ORDER = ["profile", "equipment", "insurance", "w9", "direct-deposit", "review"] as const satisfies readonly StepKey[];
export const STEP_COUNT = STEP_ORDER.length;

export const STEP_META: Record<StepKey, { label: string; title: string; lead: string; save: string }> = {
  profile: {
    label: "Profile",
    title: "Business information",
    lead: "Who the carrier contracts with, and how to reach you.",
    save: "Continue",
  },
  equipment: {
    label: "Equipment & licensing",
    title: "Equipment, licensing & service",
    lead: "The Truck / Power Unit you run, your operating authority, where you run, and how you track.",
    save: "Continue",
  },
  insurance: {
    label: "Insurance",
    title: "Insurance and certificates",
    lead: "Your policies, your agent, and the certificates that name Solidify Transport LLC as certificate holder.",
    save: "Continue",
  },
  w9: {
    label: "W-9",
    title: "Form W-9",
    lead: "Upload the official IRS form, completed and signed.",
    save: "Continue",
  },
  "direct-deposit": {
    label: "Direct deposit",
    title: "Direct deposit authorization",
    lead: "Where settlements are deposited. Sensitive values are masked on screen and sent as digits only.",
    save: "Continue to review",
  },
  review: {
    label: "Review & submit",
    title: "Review and submit",
    lead: "Check each step, then submit. Nothing is final until the server confirms it.",
    save: "Submit onboarding",
  },
};

export const stepIndex = (key: StepKey): number => STEP_ORDER.indexOf(key);
export const stepNumber = (key: StepKey): number => stepIndex(key) + 1;
export const announceStep = (key: StepKey): string => `Step ${stepNumber(key)} of ${STEP_COUNT}: ${STEP_META[key].title}.`;

export type StepStatus = "not-started" | "in-progress" | "dirty" | "saved" | "submitted";

export const STATUS_LABEL: Record<StepStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  dirty: "Unsaved changes",
  saved: "Saved",
  submitted: "Submitted",
};

/* ── Messages for the live status region ───────────────────────────────── */

export type Tone = "neutral" | "success" | "warn" | "error";
export interface Message {
  tone: Tone;
  text: string;
}

/* ── Uploads ───────────────────────────────────────────────────────────── */

export interface UploadedFile {
  fileId: string;
  name: string;
  bytes: number;
  /** Before any client-side reduction, so the UI can say what it saved. */
  originalBytes: number;
  reduced: boolean;
  mime: string;
  purpose: UploadPurpose;
  /** The bytes themselves. They live here until the application is submitted. */
  blob: File;
}

/** Matches the server's isSafeId: 16-64 of [A-Za-z0-9_-]. */
export const newFileId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().replaceAll("-", "")
    : Array.from({ length: 32 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("");

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
export const MAX_TOTAL_UPLOAD_BYTES = 3.5 * 1024 * 1024;
export const MAX_FILES_PER_SUBMISSION = 5;
export const ACCEPT = "application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png";
export const TOO_LARGE = "Each document must be 2 MB or smaller.";
export const WRONG_TYPE = "Files must be a PDF, JPEG or PNG.";

/* ── Form value shapes (what react-hook-form holds; zod validates them) ── */

export interface ProfileForm {
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  zip: string;
}

export interface EquipmentForm {
  powerUnitVin: string;
  make: string;
  model: string;
  year: string;
  capacity: string;
  dot: string;
  mc: string;
  serviceAreas: string;
  gpsTracking: string;
}

export interface InsuranceForm {
  cargoPolicyNumber: string;
  generalLiabilityPolicyNumber: string;
  autoLiabilityPolicyNumber: string;
  agentName: string;
  agentEmail: string;
  agentPhone: string;
  acknowledgedLimits: boolean;
  certificateFileIds: string[];
}

export interface W9Form {
  w9FileId: string;
  w9Confirmed: boolean;
}

export interface DirectDepositForm {
  payeeName: string;
  payeeAddressLine: string;
  payeeCity: string;
  payeeState: string;
  payeeZip: string;
  payeePhone: string;
  payeeMc: string;
  ein: string;
  bankName: string;
  bankAddressLine: string;
  bankCity: string;
  bankState: string;
  bankZip: string;
  bankPhone: string;
  bankFax: string;
  routingNumber: string;
  accountNumber: string;
  accountType: string;
  depositAuthorization: boolean;
  /** Always the current constants; the server accepts nothing else. */
  authorizationText: string;
  authorizationVersion: string;
  voidedCheckFileId: string;
  signatureName: string;
  signatureDate: string;
}

export interface StepForms {
  profile: ProfileForm;
  equipment: EquipmentForm;
  insurance: InsuranceForm;
  w9: W9Form;
  "direct-deposit": DirectDepositForm;
}

export type AnyStepForm = StepForms[OnboardingStep];

/** Blank values are functions so the date default is computed at mount, on the client. */
export const BLANK: { [K in OnboardingStep]: () => StepForms[K] } = {
  profile: () => ({ companyName: "", contactPerson: "", phone: "", email: "", addressLine: "", city: "", state: "", zip: "" }),
  equipment: () => ({ powerUnitVin: "", make: "", model: "", year: "", capacity: "", dot: "", mc: "", serviceAreas: "", gpsTracking: "" }),
  insurance: () => ({
    cargoPolicyNumber: "",
    generalLiabilityPolicyNumber: "",
    autoLiabilityPolicyNumber: "",
    agentName: "",
    agentEmail: "",
    agentPhone: "",
    acknowledgedLimits: false,
    certificateFileIds: [],
  }),
  w9: () => ({ w9FileId: "", w9Confirmed: false }),
  "direct-deposit": () => ({
    payeeName: "",
    payeeAddressLine: "",
    payeeCity: "",
    payeeState: "",
    payeeZip: "",
    payeePhone: "",
    payeeMc: "",
    ein: "",
    bankName: "",
    bankAddressLine: "",
    bankCity: "",
    bankState: "",
    bankZip: "",
    bankPhone: "",
    bankFax: "",
    routingNumber: "",
    accountNumber: "",
    accountType: "",
    depositAuthorization: false,
    authorizationText: DIRECT_DEPOSIT_AUTHORIZATION_TEXT,
    authorizationVersion: DIRECT_DEPOSIT_AUTHORIZATION_VERSION,
    voidedCheckFileId: "",
    signatureName: "",
    signatureDate: todayIso(),
  }),
};

/** Callbacks every step form receives from the root. */
export interface StepHandlers {
  onTouched: (step: OnboardingStep) => void;
  onLeave: (step: OnboardingStep, values: AnyStepForm) => void;
  onSaved: (step: OnboardingStep, values: AnyStepForm) => void;
  onOutcome: (result: Result) => void;
  onUploaded: (file: UploadedFile) => void;
}

export interface StepProps<T> {
  initial: T;
  /** Locked behind the gate: every control renders disabled. */
  disabled: boolean;
  handlers: StepHandlers;
  onBack: () => void;
}

export interface FileStepProps<T> extends StepProps<T> {
  files: Record<string, UploadedFile>;
}

/* ── Small helpers ─────────────────────────────────────────────────────── */

export const digitsOnly = (v: string): string => v.replace(/\D/g, "");

/** `•••• 1234` — the only form a secret ever takes on the review screen. */
export const lastFour = (v: string | undefined): string => {
  const d = digitsOnly(v ?? "");
  return d ? `•••• ${d.slice(-4)}` : "—";
};

export const formatBytes = (n: number): string => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

export function todayIso(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export const fid = (name: string): string => `onb-${name}`;
