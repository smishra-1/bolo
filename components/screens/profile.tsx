"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useProgress } from "@/hooks/use-progress";
import { speak } from "@/lib/client/speech";
import { fmt, uiLocaleFor } from "@/lib/i18n";
import { LANGS, NATIVE_LANGS, type TargetLang } from "@/lib/languages";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { UNITS } from "@/lib/units";
import { useApp } from "../app-provider";
import { Avatar, BottomNav, TopBar } from "../app-shell";
import { Button, Card, Notice } from "../ui";

type Word = { word: string; meaning: string };
type Words = { list: Word[]; count: number };

const WORDS_SHOWN = 24;

export function Profile() {
  const { target } = useApp();
  // CourseGate guarantees a target; reload words when it changes.
  return <ProfileView key={target} target={target as TargetLang} />;
}

function ProfileView({ target }: { target: TargetLang }) {
  const { native, course, email, displayName, m, setNative, setDisplayName } = useApp();
  const { stars, streak } = useProgress();
  const [words, setWords] = useState<Words | null>(null);
  const [joined, setJoined] = useState<Date | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let cancelled = false;
    // RLS limits both queries to the signed-in learner's rows.
    Promise.all([
      supabase
        .from("learned_words")
        .select("word, meaning", { count: "exact" })
        .eq("target_lang", target)
        .order("first_seen_at", { ascending: false })
        .limit(WORDS_SHOWN),
      supabase.from("profiles").select("created_at").maybeSingle(),
    ])
      .then(([w, p]) => {
        if (cancelled) return;
        if (w.error) throw w.error;
        setWords({ list: w.data ?? [], count: w.count ?? w.data?.length ?? 0 });
        if (p.data?.created_at) setJoined(new Date(p.data.created_at));
      })
      .catch((error: unknown) => {
        console.error("Could not load profile", error);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [target]);

  const totalStars = Object.values(stars).reduce((sum, n) => sum + (n ?? 0), 0);
  const levelName = m.levels[String(course?.level ?? 1) as "1" | "2" | "3"];
  const stats = [
    { icon: "⭐", value: course?.points ?? 0, label: m.done.points },
    { icon: "🔥", value: streak, label: m.done.streak },
    { icon: "🏅", value: `${totalStars}/${UNITS.length * 3}`, label: m.profile.stars },
    { icon: "📖", value: words?.count ?? "…", label: m.profile.words },
  ];

  return (
    <>
      <TopBar streak={streak} />
      <main className="mx-auto flex max-w-2xl flex-col gap-5 px-4 pt-6 pb-28">
        <Card className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
          <Avatar className="size-20 text-4xl" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-3xl font-bold">{displayName || m.profile.title}</h1>
            <p className="truncate text-muted">{email}</p>
            {joined && (
              <p className="mt-1 text-sm text-muted">
                {fmt(m.profile.memberSince, { date: joined.toLocaleDateString(uiLocaleFor(native), { month: "long", year: "numeric" }) })}
              </p>
            )}
          </div>
        </Card>

        <NameForm key={displayName ?? ""} initial={displayName ?? ""} onSave={setDisplayName} />

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat, i) => (
            <Card key={stat.label} className="animate-pop flex flex-col items-center p-3 text-center" style={{ animationDelay: `${120 + i * 70}ms` }}>
              <dt className="order-2 text-xs text-muted">{stat.label}</dt>
              <dd className="order-1 font-display text-2xl font-bold tabular-nums">
                <span aria-hidden>{stat.icon} </span>
                {stat.value}
              </dd>
            </Card>
          ))}
        </dl>

        <Card className={`flex items-center gap-4 p-5 ${LANGS[target].card}`}>
          <span className="font-display text-4xl font-bold" aria-hidden>{LANGS[target].badge}</span>
          <div className="flex-1">
            <p className="font-display text-2xl font-semibold">{fmt(m.profile.learning, { lang: m.languages[target] })}</p>
            <p className="text-muted">{fmt(m.profile.level, { level: levelName })}</p>
          </div>
          <Link href="/start" className="text-sm font-semibold text-brand underline-offset-4 hover:underline">
            {m.map.changeLanguage}
          </Link>
        </Card>

        <section aria-labelledby="speak-title">
          <h2 id="speak-title" className="mb-2 font-display text-xl font-bold">{m.profile.iSpeak}</h2>
          <div className="flex flex-wrap gap-2">
            {NATIVE_LANGS.map((lang) => (
              <button
                key={lang}
                type="button"
                aria-pressed={native === lang}
                onClick={() => setNative(lang).catch(() => setFailed(true))}
                className={`press rounded-full border-2 border-ink px-4 py-2 font-semibold ${native === lang ? "bg-ink text-white" : "bg-white shadow-chunky-sm hover:bg-sun-soft"}`}
              >
                {LANGS[lang].endonym}
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="words-title">
          <h2 id="words-title" className="mb-2 font-display text-xl font-bold">
            {m.profile.wordsTitle}
            {words && words.count > 0 && <span className="ml-2 text-base text-muted tabular-nums">({words.count})</span>}
          </h2>
          {words === null && !failed && <p className="text-muted">{m.common.loading}</p>}
          {words?.count === 0 && <Notice>{m.profile.noWords}</Notice>}
          {words && words.list.length > 0 && (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {words.list.map((w, i) => (
                <li key={w.word} className="animate-pop" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
                  <button
                    type="button"
                    onClick={() => speak(w.word, target)}
                    className="press flex w-full items-center gap-3 rounded-2xl border-2 border-ink bg-white px-4 py-2 text-left hover:bg-sky-50"
                  >
                    <span className="flex-1">
                      <span lang={target} className="block font-display text-lg font-semibold">{w.word}</span>
                      <span className="block text-sm text-muted">{w.meaning}</span>
                    </span>
                    <span aria-hidden>🔊</span>
                    <span className="sr-only">{m.translate.listen}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {failed && <Notice tone="error">{m.common.errorGeneric}</Notice>}
      </main>
      <BottomNav />
    </>
  );
}

function NameForm({ initial, onSave }: { initial: string; onSave: (name: string) => Promise<void> }) {
  const { m } = useApp();
  const [name, setName] = useState(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const changed = name.trim() !== initial;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!changed) return;
    setState("saving");
    try {
      await onSave(name);
      setState("saved");
    } catch (error) {
      console.error("Could not save name", error);
      setState("error");
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-1">
      <label htmlFor="profile-name" className="font-semibold">{m.profile.name}</label>
      <div className="flex gap-2">
        <input
          id="profile-name"
          value={name}
          maxLength={40}
          autoComplete="nickname"
          placeholder={m.profile.namePlaceholder}
          onChange={(e) => {
            setName(e.target.value);
            setState("idle");
          }}
          className="chunky min-h-12 min-w-0 flex-1 rounded-2xl bg-white px-4 text-lg outline-none focus-visible:ring-3 focus-visible:ring-brand"
        />
        <Button type="submit" disabled={!changed || state === "saving"}>
          {state === "saving" ? m.common.loading : m.profile.save}
        </Button>
      </div>
      <p aria-live="polite" className="min-h-5 text-sm">
        {state === "saved" && <span className="text-green-700">✓ {m.profile.saved}</span>}
        {state === "error" && <span className="text-red-700">{m.common.errorGeneric}</span>}
      </p>
    </form>
  );
}
