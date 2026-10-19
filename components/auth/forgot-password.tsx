"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { authErrorMessage } from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useApp } from "../app-provider";
import { Button, Notice } from "../ui";
import { AuthCard, Field } from "./auth-card";

export function ForgotPassword() {
  const { m } = useApp();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { error } = await getSupabaseBrowserClient().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      // Same message whether or not the account exists, so emails can't be probed.
      if (error && error.code?.startsWith("over_")) setError(authErrorMessage(error.code, m));
      else setSent(true);
    } catch (e) {
      console.error(e);
      setError(m.common.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title={m.auth.resetTitle}>
      {sent ? (
        <Notice>📬 {m.auth.resetSent}</Notice>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <p className="text-center text-muted">{m.auth.resetHelp}</p>
          <Field label={m.auth.email} type="email" autoComplete="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && <Notice tone="error">{error}</Notice>}
          <Button type="submit" disabled={busy}>
            {busy ? m.common.loading : m.auth.sendLink}
          </Button>
        </form>
      )}
      <Link href="/login" className="text-center font-semibold text-brand underline-offset-4 hover:underline">
        {m.auth.backToSignIn}
      </Link>
    </AuthCard>
  );
}
