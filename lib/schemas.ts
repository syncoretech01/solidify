import { z } from "zod";

/**
 * Validation schemas shared by the client forms and the server route
 * handlers. One definition per shape, so a field can never be accepted by
 * the browser and rejected by the server, or vice versa.
 *
 * Messages name the field and the expectation and NEVER echo the value.
 */

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
] as const;

export const STATE_NAMES: Record<(typeof US_STATES)[number], string> = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",DC:"District of Columbia",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",
};

const digits = (v: unknown) => String(v ?? "").replace(/\D/g, "");

const text = (label: string, max: number, min = 1) =>
  z
    .string()
    .trim()
    .min(min, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`);

const optionalText = (label: string, max: number) =>
  z.string().trim().max(max, `${label} must be ${max} characters or fewer.`).optional().or(z.literal(""));

/** Blank is fine; anything present must match `re`. */
const optionalPattern = (re: RegExp, message: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || re.test(v), message)
    .optional();

const isUsPhone = (v: string) => [10, 11].includes(digits(v).length);

export const phoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required.")
  .refine(isUsPhone, "Phone number must be a valid US number.");

/** Blank is fine; anything present must be a US phone number. */
export const optionalPhoneSchema = z
  .string()
  .trim()
  .refine((v) => v === "" || isUsPhone(v), "Phone number must be a valid US number.")
  .optional();

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .max(160, "Email must be 160 characters or fewer.")
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Email must be a valid address.");

export const stateSchema = z.enum(US_STATES, { message: "Select a state." });

const ZIP_RE = /^\d{5}(-\d{4})?$/;
export const zipSchema = z.string().trim().regex(ZIP_RE, "ZIP must be 5 digits.");

/** Blank is fine; anything present must be a real state code. */
export const optionalStateSchema = z
  .string()
  .trim()
  .refine((v) => v === "" || (US_STATES as readonly string[]).includes(v), "Select a state.")
  .optional();

export const optionalZipSchema = optionalPattern(ZIP_RE, "ZIP must be 5 digits.");

/** Honeypot + timing fields present on every public form. */
const antiSpam = {
  website: z.string().max(0, "Invalid submission.").optional().or(z.literal("")),
  startedAt: z.coerce.number().optional(),
};

/* ────────────────────────────────────────────────────────────── inquiries ── */

export const vehicleQuoteSchema = z.object({
  lane: z.literal("vehicle"),
  pickupCity: text("Pickup city", 80),
  pickupState: stateSchema,
  deliveryCity: text("Delivery city", 80),
  deliveryState: stateSchema,
  vehicleYear: z
    .string()
    .trim()
    .regex(/^(19|20)\d{2}$/, "Vehicle year must be a four-digit year."),
  vehicleMake: text("Vehicle make", 60),
  vehicleModel: text("Vehicle model", 60),
  operable: z.enum(["operable", "inoperable"], { message: "Tell us whether the vehicle runs." }),
  preferredDate: optionalText("Preferred date", 40),
  name: text("Name", 120),
  phone: phoneSchema,
  email: emailSchema,
  notes: optionalText("Notes", 1200),
  ...antiSpam,
});

export const oemInquirySchema = z.object({
  lane: z.literal("oem"),
  company: text("Company", 160),
  role: optionalText("Role", 80),
  orgType: z.enum(["oem", "dealership", "dealer-group", "other"], { message: "Select an organization type." }),
  name: text("Name", 120),
  phone: phoneSchema,
  email: emailSchema,
  originRegion: optionalText("Origin region", 160),
  destinationRegion: optionalText("Destination region", 160),
  volume: optionalText("Approximate volume", 120),
  notes: optionalText("Notes", 1600),
  ...antiSpam,
});

export const operatorInquirySchema = z.object({
  lane: z.literal("operator"),
  name: text("Name", 120),
  phone: phoneSchema,
  email: emailSchema,
  homeBase: optionalText("Home base", 120),
  equipment: optionalText("Equipment", 200),
  notes: optionalText("Notes", 1200),
  ...antiSpam,
});

export const inquirySchema = z.discriminatedUnion("lane", [
  vehicleQuoteSchema,
  oemInquirySchema,
  operatorInquirySchema,
]);

export type VehicleQuote = z.infer<typeof vehicleQuoteSchema>;
export type OemInquiry = z.infer<typeof oemInquirySchema>;
export type OperatorInquiry = z.infer<typeof operatorInquirySchema>;
export type Inquiry = z.infer<typeof inquirySchema>;

/* ───────────────────────────────────────────────────────────── onboarding ── */

export const vinSchema = z
  .string()
  .trim()
  .transform((v) => v.toUpperCase())
  .pipe(z.string().regex(/^[A-HJ-NPR-Z0-9]{17}$/, "VIN must be 17 characters (no I, O or Q)."));

export const MC_RE = /^\d{5,8}$/;
export const dotSchema = z.string().trim().regex(/^\d{5,8}$/, "USDOT number must be 5 to 8 digits.");
export const mcSchema = z.string().trim().regex(MC_RE, "MC number must be 5 to 8 digits.");
export const optionalMcSchema = optionalPattern(MC_RE, "MC number must be 5 to 8 digits.");

export const profileStepSchema = z.object({
  companyName: text("Company or operator name", 160),
  contactPerson: text("Contact person", 120),
  phone: phoneSchema,
  email: emailSchema,
  addressLine: text("Street address", 160),
  city: text("City", 80),
  state: stateSchema,
  zip: zipSchema,
});

export const equipmentStepSchema = z.object({
  powerUnitVin: vinSchema,
  make: text("Make", 60),
  model: text("Model", 60),
  // Not on the client's profile sheet; kept as an optional convenience.
  year: optionalPattern(/^(19|20)\d{2}$/, "Year must be a four-digit year."),
  capacity: text("Capacity", 80),
  dot: dotSchema,
  mc: mcSchema,
  serviceAreas: text("Primary service areas", 400),
  gpsTracking: text("GPS / tracking", 200),
});

export const insuranceStepSchema = z.object({
  cargoPolicyNumber: text("Cargo insurance policy number", 60),
  generalLiabilityPolicyNumber: text("General liability policy number", 60),
  autoLiabilityPolicyNumber: optionalText("Auto liability policy number", 60),
  agentName: text("Insurance agent name", 160),
  agentEmail: emailSchema,
  agentPhone: phoneSchema,
  acknowledgedLimits: z.literal(true, { message: "Confirm that your coverage meets the required limits." }),
  certificateFileIds: z.array(z.string().min(1)).min(1, "Upload at least one certificate of insurance.").max(3),
});

export const w9StepSchema = z.object({
  w9FileId: z.string().min(1, "Upload your completed, signed W-9."),
  w9Confirmed: z.literal(true, { message: "Confirm the W-9 is complete and signed." }),
});

/** ABA routing number checksum. */
export const abaValid = (routing: string) => {
  const d = digits(routing);
  if (d.length !== 9) return false;
  const w = [3, 7, 1, 3, 7, 1, 3, 7, 1];
  const sum = d.split("").reduce((acc, ch, i) => acc + Number(ch) * w[i], 0);
  return sum % 10 === 0;
};

/**
 * The Direct Deposit Authorization wording, verbatim from the client's form
 * (with "Solidify Transport LLC" unpunctuated). The client sends both values
 * with the step and the server accepts only an exact match, so the record
 * always carries the precise words that were consented to. Bump the version
 * whenever the text changes.
 */
export const DIRECT_DEPOSIT_AUTHORIZATION_VERSION = "dda-2026-09";
export const DIRECT_DEPOSIT_AUTHORIZATION_TEXT =
  "I authorize Solidify Transport LLC to deposit all payments due to me in the account(s) named herein. I further authorize Solidify Transport LLC the authority to make debits or take other corrective actions, if necessary, in relation to any deposit made by Solidify Transport LLC into the account(s).";

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A real calendar date written YYYY-MM-DD. Deliberately unrelated to today. */
export const isCalendarDate = (v: string): boolean => {
  const m = DATE_RE.exec(v);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (y < 1000 || mo < 1 || mo > 12 || d < 1) return false;
  // Day 0 of the following month is the last day of `mo`.
  return d <= new Date(Date.UTC(y, mo, 0)).getUTCDate();
};

/**
 * Direct Deposit Authorization — every field on the client's form.
 *
 * Required vs optional was decided against the form and the ACH workflow,
 * not carried over from the previous implementation:
 *
 *  REQUIRED — the authorization cannot function without them:
 *   payeeName (who is paid), ein (the payer's tax reporting for the payee),
 *   routingNumber + accountNumber + accountType (the ACH entry itself),
 *   depositAuthorization + authorizationText/Version (the consent and the
 *   exact words consented to), voidedCheckFileId (the form's attachment and
 *   the bookkeeper's cross-check of routing/account), signatureName +
 *   signatureDate (the form's "By / Date" line).
 *
 *  OPTIONAL, format-checked when present:
 *   payee address, payeePhone, payeeMc — the profile and equipment steps
 *   already hold the carrier's address, phone and MC, and an ACH entry does
 *   not use them; they are on the form for the bookkeeper's cross-reference.
 *   bankName, institution address, bankPhone, bankFax — the routing number
 *   identifies the institution and the voided check shows its name; these
 *   are contact convenience only, never used to route a payment.
 */
export const directDepositStepSchema = z.object({
  payeeName: text("Payee / company name", 160),
  payeeAddressLine: optionalText("Payee street address", 160),
  payeeCity: optionalText("Payee city", 80),
  payeeState: optionalStateSchema,
  payeeZip: optionalZipSchema,
  payeePhone: optionalPhoneSchema,
  payeeMc: optionalMcSchema,
  ein: z.string().trim().refine((v) => digits(v).length === 9, "EIN must be 9 digits."),
  bankName: optionalText("Financial institution", 160),
  bankAddressLine: optionalText("Institution address", 160),
  bankCity: optionalText("Institution city", 80),
  bankState: optionalStateSchema,
  bankZip: optionalZipSchema,
  bankPhone: optionalPhoneSchema,
  bankFax: optionalPhoneSchema,
  routingNumber: z
    .string()
    .trim()
    .refine((v) => digits(v).length === 9, "Routing number must be 9 digits.")
    .refine((v) => abaValid(v), "Routing number failed its checksum — please re-check it."),
  accountNumber: z.string().trim().refine((v) => {
    const n = digits(v).length;
    return n >= 4 && n <= 17;
  }, "Account number must be 4 to 17 digits."),
  accountType: z.enum(["checking", "savings"], { message: "Select an account type." }),
  depositAuthorization: z.literal(true, { message: "Tick the authorization to continue." }),
  authorizationText: z.literal(DIRECT_DEPOSIT_AUTHORIZATION_TEXT, { message: "The authorization wording is out of date. Reload the page and try again." }),
  authorizationVersion: z.literal(DIRECT_DEPOSIT_AUTHORIZATION_VERSION, { message: "The authorization version is out of date. Reload the page and try again." }),
  voidedCheckFileId: z.string().min(1, "Upload a voided check."),
  signatureName: text("Signature (typed full name)", 120),
  signatureDate: z.string().trim().refine(isCalendarDate, "Enter a valid date."),
});

export const ONBOARDING_STEPS = ["profile", "equipment", "insurance", "w9", "direct-deposit"] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const STEP_SCHEMAS = {
  profile: profileStepSchema,
  equipment: equipmentStepSchema,
  insurance: insuranceStepSchema,
  w9: w9StepSchema,
  "direct-deposit": directDepositStepSchema,
} as const;

export type ProfileStep = z.infer<typeof profileStepSchema>;
export type EquipmentStep = z.infer<typeof equipmentStepSchema>;
export type InsuranceStep = z.infer<typeof insuranceStepSchema>;
export type W9Step = z.infer<typeof w9StepSchema>;
export type DirectDepositStep = z.infer<typeof directDepositStepSchema>;

/** Which fields are secrets: masked in the UI, digits-only on the wire, never logged. */
export const SECRET_FIELDS = new Set(["ein", "routingNumber", "accountNumber"]);

/** Reduce a zod error to { field: message }, first message per field. */
export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

export const stepFileFields: Record<OnboardingStep, string[]> = {
  profile: [],
  equipment: [],
  insurance: ["certificateFileIds"],
  w9: ["w9FileId"],
  "direct-deposit": ["voidedCheckFileId"],
};
