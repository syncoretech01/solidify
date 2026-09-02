"use client";

import { useState, type FormEvent } from "react";
import { Field } from "@/components/forms/Field";

const CODE_ID = "onboarding-code";
const CODE_NOTE = "Issued by Solidify Transport to approved operators. The code is checked on the server and is never stored in this browser.";

/**
 * The access gate. The server decides: a code is exchanged for a session,
 * refused, rate limited, or answered with the honest not-configured state.
 * Nothing here ever reveals whether a code exists.
 */
export function AccessGate({ disabled, busy, onUnlock }: { disabled: boolean; busy: boolean; onUnlock: (code: string) => void }) {
  const [code, setCode] = useState("");

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy || disabled) return;
    onUnlock(code);
  };

  return (
    <form data-onboarding-gate noValidate onSubmit={submit} aria-busy={busy} className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
      <Field id={CODE_ID} label="Access code" note={CODE_NOTE}>
        <input
          id={CODE_ID}
          name="code"
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={128}
          className="input"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={disabled}
          aria-describedby={`${CODE_ID}-note`}
        />
      </Field>
      <div className="sm:pt-[calc(var(--step--1)*1.6+0.45rem)]">
        <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={disabled || busy}>
          {busy ? "Checking…" : "Unlock onboarding"}
        </button>
      </div>
    </form>
  );
}
