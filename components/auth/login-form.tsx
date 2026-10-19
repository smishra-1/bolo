"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { MIN_PASSWORD_LENGTH, authErrorMessage, safeNext } from "@/lib/auth";
import { fmt } from "@/lib/i18n";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useApp } from "../app-provider";
import { Button, Notice, Spinner } from "../ui";
import { AuthCard, Field, PasswordField } from "./auth-card";

type Mode = "signIn" | "signUp";

export function LoginForm() {
  const { status, m } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(params.get("error") === "link" ? m.auth.linkError : null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (status === "ready") router.replace(next);
  }, [status, next, router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (mode === "signUp" && password.length < MIN_PASSWORD_LENGTH) {
      setError(fmt(m.auth.tooShort, { n: MIN_PASSWORD_LENGTH }));
      return;
    }
    setBusy(true);
    const auth = getSupabaseBrowserClient().auth;
    try {
      if (mode === "signIn") {
        const { error } = await auth.signInWithPassword({ email: email.trim(), password });
        if (error) setError(authErrorMessage(error.code, m));
        // On success the provider sees SIGNED_IN and the effect above redirects.
      } else {
        const { data, error } = await auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
        });
        if (error) setError(authErrorMessage(error.code, m));
        else if (!data.session) setSent(true); // Email confirmation is on.
      }
    } catch (e) {
      console.error(e);
      setError(m.common.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  if (status === "unconfigured") return <AuthCard title={m.auth.signInTitle}><Notice tone="error">{m.common.setupNeeded}</Notice></AuthCard>;
  if (status === "loading" || status === "ready") return <Spinner label={m.common.loading} />;

  const signUp = mode === "signUp";
  return (
    <AuthCard title={signUp ? m.auth.signUpTitle : m.auth.signInTitle}>
      {sent ? (
        <Notice>📬 {m.auth.checkEmail}</Notice>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          {signUp && <p className="text-center text-muted">{m.auth.grownUp}</p>}
          <Field label={m.auth.email} type="email" autoComplete="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} />
          <PasswordField
            label={m.auth.password}
            autoComplete={signUp ? "new-password" : "current-password"}
            required
            minLength={signUp ? MIN_PASSWORD_LENGTH : undefined}
            maxLength={72}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint={signUp ? fmt(m.auth.passwordHint, { n: MIN_PASSWORD_LENGTH }) : undefined}
          />
          {error && <Notice tone="error">{error}</Notice>}
          <Button type="submit" disabled={busy}>
            {busy ? m.common.loading : signUp ? m.auth.signUp : m.auth.signIn}
          </Button>
          {!signUp && (
            <Link href="/forgot-password" className="text-center text-sm font-semibold text-brand underline-offset-4 hover:underline">
              {m.auth.forgot}
            </Link>
          )}
        </form>
      )}
      <button
        type="button"
        onClick={() => {
          setMode(signUp ? "signIn" : "signUp");
          setError(null);
          setSent(false);
        }}
        className="font-semibold text-brand underline-offset-4 hover:underline"
      >
        {signUp ? m.auth.switchToSignIn : m.auth.switchToSignUp}
      </button>
    </AuthCard>
  );
}
