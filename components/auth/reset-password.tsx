"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { MIN_PASSWORD_LENGTH, authErrorMessage } from "@/lib/auth";
import { fmt } from "@/lib/i18n";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useApp } from "../app-provider";
import { Button, Notice, Spinner } from "../ui";
import { AuthCard, PasswordField } from "./auth-card";

/** Reached from the reset email: /auth/callback has already signed the learner in. */
export function ResetPassword() {
  const { status, m } = useApp();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(fmt(m.auth.tooShort, { n: MIN_PASSWORD_LENGTH }));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { error } = await getSupabaseBrowserClient().auth.updateUser({ password });
      if (error) setError(authErrorMessage(error.code, m));
      else router.replace("/map");
    } catch (e) {
      console.error(e);
      setError(m.common.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") return <Spinner label={m.common.loading} />;

  return (
    <AuthCard title={m.auth.newPasswordTitle}>
      {status !== "ready" ? (
        <>
          <Notice tone="error">{m.auth.linkError}</Notice>
          <Link href="/forgot-password" className="text-center font-semibold text-brand underline-offset-4 hover:underline">
            {m.auth.forgot}
          </Link>
        </>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <PasswordField
            label={m.auth.newPassword}
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            maxLength={72}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint={fmt(m.auth.passwordHint, { n: MIN_PASSWORD_LENGTH })}
          />
          {error && <Notice tone="error">{error}</Notice>}
          <Button type="submit" disabled={busy}>
            {busy ? m.common.loading : m.auth.savePassword}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
