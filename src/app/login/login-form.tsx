"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { Field, btnPrimary } from "@/components/ui";

const initial: LoginState = {};

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initial);
  return (
    <form action={formAction} className="space-y-4">
      <Field label="Email" name="email" type="email" required placeholder="you@example.com" />
      <Field label="Password" name="password" type="password" required />
      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}
      <SubmitButton className={`${btnPrimary} w-full`} pendingText="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
