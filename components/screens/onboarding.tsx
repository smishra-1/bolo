"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fmt } from "@/lib/i18n";
import { LANGS, NATIVE_LANGS, learnableFor, type TargetLang } from "@/lib/languages";
import { useApp } from "../app-provider";
import { SignOutButton } from "../app-shell";
import { ButtonLink, Notice, Spinner } from "../ui";

const TEAM = "Shobhit, Vardaan, Reyansh & Gaurang";

export function Onboarding() {
  const { status, native, target, m, setNative, setTarget } = useApp();
  const router = useRouter();
  const [busy, setBusy] = useState<TargetLang | null>(null);
  const [failed, setFailed] = useState(false);
  const ready = status === "ready";

  useEffect(() => {
    if (status === "signedOut") router.replace("/login");
  }, [status, router]);

  async function pick(lang: TargetLang) {
    setBusy(lang);
    setFailed(false);
    try {
      const same = lang === target;
      await setTarget(lang);
      router.push(same ? "/map" : "/check");
    } catch (error) {
      console.error(error);
      setFailed(true);
      setBusy(null);
    }
  }

  if (status === "loading" || status === "signedOut") return <Spinner label={m.common.loading} />;

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-8 px-4 py-8">
      <header className="text-center">
        <p className="font-display text-5xl font-bold text-brand">
          Bolo<span aria-hidden className="inline-block animate-float"> 🦜</span>
        </p>
        <p className="mt-1 text-lg text-muted">{m.onboarding.tagline}</p>
      </header>

      {status === "unconfigured" && <Notice tone="error">{m.common.setupNeeded}</Notice>}
      {status === "error" && <Notice tone="error">{m.common.errorGeneric}</Notice>}

      {ready && target && (
        <ButtonLink href="/map" className="self-center">
          {fmt(m.onboarding.continueLearning, { lang: m.languages[target] })} →
        </ButtonLink>
      )}

      <section aria-labelledby="speak-title">
        <h1 id="speak-title" className="mb-3 text-center font-display text-2xl font-semibold">
          {m.onboarding.speakTitle}
        </h1>
        <div className="flex flex-wrap justify-center gap-2">
          {NATIVE_LANGS.map((lang) => (
            <button
              key={lang}
              type="button"
              aria-pressed={native === lang}
              onClick={() => setNative(lang).catch(() => setFailed(true))}
              className={`press rounded-full border-2 border-ink px-4 py-2 font-semibold ${native === lang ? "bg-ink text-white" : "bg-white shadow-chunky-sm"}`}
            >
              {LANGS[lang].endonym}
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="learn-title">
        <h2 id="learn-title" className="mb-4 text-center font-display text-3xl font-bold">
          {m.onboarding.learnTitle}
        </h2>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {learnableFor(native).map((lang, i) => (
            <li key={lang} className="animate-pop" style={{ animationDelay: `${100 + i * 70}ms` }}>
              <button
                type="button"
                disabled={!ready || busy !== null}
                onClick={() => pick(lang)}
                className={`chunky press group flex w-full items-center gap-4 rounded-3xl p-5 text-left disabled:opacity-60 ${LANGS[lang].card}`}
              >
                <span className="inline-block font-display text-4xl font-bold group-hover:animate-wiggle">{LANGS[lang].badge}</span>
                <span className="flex flex-col">
                  <span className="font-display text-2xl font-semibold">{m.languages[lang]}</span>
                  <span className="text-muted">{busy === lang ? m.common.loading : LANGS[lang].greeting}</span>
                </span>
                {target === lang && <span className="ml-auto inline-block animate-star text-2xl" aria-hidden>✅</span>}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-center text-muted">{m.onboarding.tapToStart}</p>
        {failed && <div className="mt-4"><Notice tone="error">{m.common.errorGeneric}</Notice></div>}
      </section>

      <footer className="mt-auto flex flex-col items-center gap-2 text-center text-sm text-muted">
        {ready && <SignOutButton />}
        {fmt(m.onboarding.madeBy, { names: TEAM })}
      </footer>
    </main>
  );
}
