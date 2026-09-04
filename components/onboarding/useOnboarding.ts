"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { ONBOARDING_STEPS, type OnboardingStep } from "@/lib/schemas";
import {
  checkHealth,
  endSession as endSessionRequest,
  openSession,
  submitAll,
  unlock as unlockRequest,
  type Result,
  type SubmitFile,
} from "@/lib/onboarding-client";
import { COMPANY } from "@/lib/site";
import {
  STEP_META,
  STEP_ORDER,
  announceStep,
  stepIndex,
  type AnyStepForm,
  type Message,
  type StepForms,
  type StepKey,
  type StepStatus,
  type UploadedFile,
} from "./types";

/* ── Copy ──────────────────────────────────────────────────────────────── */

export const LOCKED_MESSAGE = `Onboarding is not accepting submissions yet because delivery is not configured on this server. Nothing you enter here is saved or sent. Please contact Solidify Transport directly at ${COMPANY.phone}.`;

const GATE_MESSAGE =
  "Enter the access code Solidify Transport gave you to begin. Complete all six steps in one sitting — nothing leaves this page until you submit, and this website keeps no copy afterwards.";

const SESSION_LOST_MESSAGE =
  "Your onboarding session has expired. Enter your access code again — what you have filled in on this page is still here.";

export function retryText(retryAfter?: number): string {
  const mins = Math.max(1, Math.ceil((retryAfter ?? 60) / 60));
  return `Too many attempts from this connection. Please wait about ${mins} minute${mins === 1 ? "" : "s"} and try again.`;
}

/** Turn any non-success Result into plain language for the status region. */
export function describeOutcome(result: Result): Message {
  switch (result.kind) {
    case "saved":
      return { tone: "success", text: result.message ?? "Saved." };
    case "invalid_code":
      return { tone: "error", text: "That access code was not recognized." };
    case "rate_limited":
      return { tone: "warn", text: retryText(result.retryAfter) };
    case "not_configured":
      return { tone: "warn", text: LOCKED_MESSAGE };
    case "no_session":
      return { tone: "error", text: SESSION_LOST_MESSAGE };
    case "invalid":
      return { tone: "error", text: result.message ?? "Please check the highlighted fields." };
    case "too_large":
      return { tone: "error", text: result.message ?? "Files must be 4 MB or smaller." };
    case "incomplete":
      return { tone: "error", text: result.message ?? "Finish every step before submitting." };
    case "blocked":
      return { tone: "error", text: result.message ?? "This request was blocked. Reload the page and try again." };
    case "offline":
      return { tone: "error", text: result.message ?? "We could not reach the server. Check your connection and try again." };
    case "failed":
    default:
      return { tone: "error", text: result.message ?? "That did not save. Nothing was stored — please try again." };
  }
}

/* ── State ─────────────────────────────────────────────────────────────── */

export type Phase = "booting" | "locked" | "gate" | "unlocked" | "done";

export interface OnboardingState {
  phase: Phase;
  /** A gate / submit / end-session request is in flight. */
  busy: boolean;
  message: Message | null;
  current: StepKey;
  /** Increments on every programmatic step change; drives heading focus. */
  navCount: number;
  /** Increments whenever the session identity changes; keys the step forms so nothing leaks across sessions. */
  session: number;
  submissionId: string | null;
  status: Record<OnboardingStep, StepStatus>;
  /** What the user has typed, per step, so leaving a step does not lose it. */
  drafts: Partial<StepForms>;
  /** The values the server accepted, per step, for the review screen. */
  saved: Partial<StepForms>;
  files: Record<string, UploadedFile>;
  /** Steps the server reported missing on the last submit attempt. */
  missing: OnboardingStep[];
}

type Action =
  | { type: "LOCKED" }
  | { type: "GATE"; message?: Message | null }
  | { type: "RESUMED"; submissionId: string; completed: OnboardingStep[]; complete: boolean }
  | { type: "UNLOCKED"; submissionId: string }
  | { type: "MESSAGE"; message: Message }
  | { type: "BUSY"; busy: boolean }
  | { type: "GO"; step: StepKey }
  | { type: "TOUCHED"; step: OnboardingStep }
  | { type: "DRAFT"; step: OnboardingStep; values: AnyStepForm }
  | { type: "FILE"; file: UploadedFile }
  | { type: "SAVED"; step: OnboardingStep; values: AnyStepForm }
  | { type: "SUBMITTED"; submissionId: string }
  | { type: "INCOMPLETE"; missing: OnboardingStep[] }
  | { type: "SESSION_LOST" }
  | { type: "ENDED" };

const blankStatus = (): Record<OnboardingStep, StepStatus> => ({
  profile: "not-started",
  equipment: "not-started",
  insurance: "not-started",
  w9: "not-started",
  "direct-deposit": "not-started",
});

const initialState: OnboardingState = {
  phase: "booting",
  busy: false,
  message: { tone: "neutral", text: "Checking whether onboarding is open…" },
  current: "profile",
  navCount: 0,
  session: 0,
  submissionId: null,
  status: blankStatus(),
  drafts: {},
  saved: {},
  files: {},
  missing: [],
};

function withEntry(map: Partial<StepForms>, step: OnboardingStep, values: AnyStepForm): Partial<StepForms> {
  return { ...map, [step]: values } as Partial<StepForms>;
}

/** File ids belong to one submission; they never survive a session change. */
function stripFileIds(drafts: Partial<StepForms>): Partial<StepForms> {
  const out: Partial<StepForms> = { ...drafts };
  if (out.insurance) out.insurance = { ...out.insurance, certificateFileIds: [] };
  if (out.w9) out.w9 = { ...out.w9, w9FileId: "" };
  if (out["direct-deposit"]) out["direct-deposit"] = { ...out["direct-deposit"], voidedCheckFileId: "" };
  return out;
}

function firstIncomplete(status: Record<OnboardingStep, StepStatus>): StepKey {
  return ONBOARDING_STEPS.find((s) => status[s] !== "saved" && status[s] !== "submitted") ?? "review";
}

function reducer(state: OnboardingState, action: Action): OnboardingState {
  switch (action.type) {
    case "LOCKED":
      return { ...state, phase: "locked", busy: false, message: { tone: "warn", text: LOCKED_MESSAGE } };

    case "GATE":
      return { ...state, phase: "gate", busy: false, message: action.message ?? { tone: "neutral", text: GATE_MESSAGE } };

    case "RESUMED": {
      const status = blankStatus();
      for (const s of ONBOARDING_STEPS) {
        if (action.complete) status[s] = "submitted";
        else if (action.completed.includes(s)) status[s] = "saved";
      }
      const current = action.complete ? "review" : firstIncomplete(status);
      return {
        ...state,
        phase: action.complete ? "done" : "unlocked",
        busy: false,
        session: state.session + 1,
        submissionId: action.submissionId,
        status,
        drafts: {},
        saved: {},
        files: {},
        missing: [],
        current,
        message: action.complete
          ? { tone: "success", text: "This onboarding has already been submitted." }
          : {
              tone: "success",
              text: `Welcome back — your session is still open. ${action.completed.length} of ${ONBOARDING_STEPS.length} steps are saved on the server. ${announceStep(current)}`,
            },
      };
    }

    case "UNLOCKED":
      return {
        ...state,
        phase: "unlocked",
        busy: false,
        session: state.session + 1,
        submissionId: action.submissionId,
        status: blankStatus(),
        drafts: stripFileIds(state.drafts),
        saved: {},
        files: {},
        missing: [],
        current: "profile",
        navCount: state.navCount + 1,
        message: { tone: "success", text: `Access confirmed. ${announceStep("profile")}` },
      };

    case "MESSAGE":
      return { ...state, message: action.message };

    case "BUSY":
      return { ...state, busy: action.busy };

    case "GO":
      if (action.step === state.current) return state;
      return { ...state, current: action.step, navCount: state.navCount + 1, message: { tone: "neutral", text: announceStep(action.step) } };

    case "TOUCHED": {
      if (state.phase !== "unlocked") return state;
      const cur = state.status[action.step];
      const next: StepStatus = cur === "saved" ? "dirty" : cur === "not-started" ? "in-progress" : cur;
      if (next === cur) return state;
      return { ...state, status: { ...state.status, [action.step]: next } };
    }

    case "DRAFT":
      // A form unmounting because the session ended must not write its values back.
      if (state.phase !== "unlocked") return state;
      return { ...state, drafts: withEntry(state.drafts, action.step, action.values) };

    case "FILE":
      return { ...state, files: { ...state.files, [action.file.fileId]: action.file } };

    case "SAVED": {
      const next = STEP_ORDER[stepIndex(action.step) + 1] ?? "review";
      return {
        ...state,
        status: { ...state.status, [action.step]: "saved" },
        saved: withEntry(state.saved, action.step, action.values),
        missing: state.missing.filter((m) => m !== action.step),
        current: next,
        navCount: state.navCount + 1,
        message: { tone: "success", text: `${STEP_META[action.step].title} saved. ${announceStep(next)}` },
      };
    }

    case "SUBMITTED": {
      const status = blankStatus();
      for (const s of ONBOARDING_STEPS) status[s] = "submitted";
      return {
        ...state,
        phase: "done",
        busy: false,
        submissionId: action.submissionId,
        status,
        missing: [],
        current: "review",
        navCount: state.navCount + 1,
        message: { tone: "success", text: `Onboarding submitted. Your reference is ${action.submissionId}.` },
      };
    }

    case "INCOMPLETE": {
      const names = action.missing.map((m) => STEP_META[m].title).join(", ");
      return {
        ...state,
        busy: false,
        missing: action.missing,
        message: { tone: "error", text: names ? `Not submitted. Finish these steps first: ${names}.` : "Not submitted. Finish every step first." },
      };
    }

    case "SESSION_LOST":
      return {
        ...state,
        phase: "gate",
        busy: false,
        submissionId: null,
        status: blankStatus(),
        saved: {},
        files: {},
        drafts: stripFileIds(state.drafts),
        missing: [],
        current: "profile",
        session: state.session + 1,
        message: { tone: "error", text: SESSION_LOST_MESSAGE },
      };

    case "ENDED":
      return {
        ...initialState,
        phase: "gate",
        navCount: state.navCount,
        session: state.session + 1,
        message: { tone: "neutral", text: "Session ended. Nothing from it remains in this browser." },
      };

    default:
      return state;
  }
}

/* ── Hook ──────────────────────────────────────────────────────────────── */

export function useOnboarding() {
  const [state, dispatch] = useReducer(reducer, initialState);
  // submit() reads the latest drafts and blobs without re-creating itself.
  const stateRef = useRef(state);
  stateRef.current = state;

  // Boot: health first (so a locked server never triggers a needless 401),
  // then try to resume a session cookie.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const health = await checkHealth();
      if (cancelled) return;
      if (health.ok && health.data?.onboarding.configured === false) {
        dispatch({ type: "LOCKED" });
        return;
      }
      const session = await openSession();
      if (cancelled) return;
      if (session.ok && session.data) {
        dispatch({ type: "RESUMED", submissionId: session.data.reference, completed: [], complete: false });
        return;
      }
      if (session.kind === "not_configured") {
        dispatch({ type: "LOCKED" });
        return;
      }
      if (session.kind === "no_session") {
        dispatch({
          type: "GATE",
          message: health.ok ? null : { tone: "warn", text: "We could not confirm the server status right now. You can still try your access code." },
        });
        return;
      }
      dispatch({ type: "GATE", message: describeOutcome(session) });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onOutcome = useCallback((result: Result) => {
    if (result.kind === "no_session") dispatch({ type: "SESSION_LOST" });
    else if (result.kind === "not_configured") dispatch({ type: "LOCKED" });
    else dispatch({ type: "MESSAGE", message: describeOutcome(result) });
  }, []);

  const unlock = useCallback(async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) {
      dispatch({ type: "MESSAGE", message: { tone: "error", text: "Enter your access code." } });
      return;
    }
    dispatch({ type: "BUSY", busy: true });
    const result = await unlockRequest(trimmed);
    dispatch({ type: "BUSY", busy: false });
    if (result.ok && result.data) {
      dispatch({ type: "UNLOCKED", submissionId: result.data.reference });
      return;
    }
    if (result.kind === "not_configured") {
      dispatch({ type: "LOCKED" });
      return;
    }
    if (result.kind === "invalid") {
      dispatch({ type: "MESSAGE", message: { tone: "error", text: "Enter your access code." } });
      return;
    }
    dispatch({ type: "MESSAGE", message: describeOutcome(result) });
  }, []);

  const goTo = useCallback((step: StepKey) => dispatch({ type: "GO", step }), []);

  const back = useCallback(() => {
    const i = stepIndex(state.current);
    if (i > 0) dispatch({ type: "GO", step: STEP_ORDER[i - 1] });
  }, [state.current]);

  const markTouched = useCallback((step: OnboardingStep) => dispatch({ type: "TOUCHED", step }), []);
  const setDraft = useCallback((step: OnboardingStep, values: AnyStepForm) => dispatch({ type: "DRAFT", step, values }), []);
  const addFile = useCallback((file: UploadedFile) => dispatch({ type: "FILE", file }), []);
  const onSaved = useCallback((step: OnboardingStep, values: AnyStepForm) => dispatch({ type: "SAVED", step, values }), []);

  /**
   * The whole application, in one request. On any failure the drafts and the
   * document blobs stay exactly where they are, so pressing submit again costs
   * the applicant nothing — which is the point of holding it all in memory.
   */
  const submit = useCallback(async () => {
    dispatch({ type: "BUSY", busy: true });

    const payload: Record<string, unknown> = {};
    for (const step of ONBOARDING_STEPS) {
      const values = stateRef.current.saved[step] ?? stateRef.current.drafts[step];
      if (values) payload[step] = values;
    }
    const files: SubmitFile[] = Object.values(stateRef.current.files).map((f) => ({ id: f.fileId, purpose: f.purpose, file: f.blob }));

    const result = await submitAll(payload, files);
    if (result.ok && result.data) {
      dispatch({ type: "SUBMITTED", submissionId: result.data.reference });
      return;
    }
    dispatch({ type: "BUSY", busy: false });
    if (result.kind === "incomplete") {
      dispatch({ type: "INCOMPLETE", missing: result.missing ?? [] });
      return;
    }
    onOutcome(result);
  }, [onOutcome]);

  const endSession = useCallback(async () => {
    dispatch({ type: "BUSY", busy: true });
    await endSessionRequest();
    dispatch({ type: "ENDED" });
  }, []);

  const hasUnsaved = ONBOARDING_STEPS.some((s) => state.status[s] === "in-progress" || state.status[s] === "dirty");

  // A refresh loses everything held in memory; say so while it matters.
  useEffect(() => {
    if (state.phase !== "unlocked" || !hasUnsaved) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [state.phase, hasUnsaved]);

  return { state, hasUnsaved, unlock, goTo, back, markTouched, setDraft, addFile, onSaved, onOutcome, submit, endSession };
}

export type OnboardingController = ReturnType<typeof useOnboarding>;
