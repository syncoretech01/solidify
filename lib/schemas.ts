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

export const phoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required.")
  .refine((v) => [10, 11].includes(digits(v).length), "Phone number must be a valid US number.");

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .max(160, "Email must be 160 characters or fewer.")
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Email must be a valid address.");

export const stateSchema = z.enum(US_STATES, { message: "Select a state." });

export const zipSchema = z.string().trim().regex(/^\d{5}(-\d{4})?$/, "ZIP must be 5 digits.");

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

export const dotSchema = z.string().trim().regex(/^\d{5,8}$/, "USDOT number must be 5 to 8 digits.");
export const mcSchema = z.string().trim().regex(/^\d{5,8}$/, "MC number must be 5 to 8 digits.");

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
  year: z.string().trim().regex(/^(19|20)\d{2}$/, "Year must be a four-digit year."),
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

export const directDepositStepSchema = z.object({
  payeeName: text("Payee / company name", 160),
  payeeAddressLine: text("Payee street address", 160),
  payeeCity: text("Payee city", 80),
  payeeState: stateSchema,
  payeeZip: zipSchema,
  payeePhone: phoneSchema,
  ein: z.string().trim().refine((v) => digits(v).length === 9, "EIN must be 9 digits."),
  bankName: text("Financial institution", 160),
  bankAddressLine: text("Institution address", 160),
  bankCity: text("Institution city", 80),
  bankState: stateSchema,
  bankZip: zipSchema,
  bankContact: optionalText("Institution contact", 160),
  bankPhone: optionalText("Institution phone", 40),
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
  depositAuthorization: z.literal(true, { message: "Authorize 100% deposit to this account." }),
  voidedCheckFileId: z.string().min(1, "Upload a voided check."),
  signatureName: text("Signature (typed full name)", 120),
  signatureDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter the date."),
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
