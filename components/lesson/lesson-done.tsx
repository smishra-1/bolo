"use client";

import { useEffect, useRef, useState } from "react";
import { useProgress } from "@/hooks/use-progress";
import { fmt } from "@/lib/i18n";
import type { LessonContent } from "@/lib/lesson";
import { nextStep, pointsFor, starsFor } from "@/lib/progress";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Part, UnitId } from "@/lib/units";
import { useApp } from "../app-provider";
import { ReviewList } from "../review";
import { Button, ButtonLink, Card, Confetti, Mascot, Notice } from "../ui";
import type { StepOutcome } from "./steps";

type Saved = { stars: number; points: number; new_items: number };

type Props = { unitId: UnitId; part: Part; content: LessonContent; correct: number; total: number; outcomes: StepOutcome[]; onAgain: () => void };

export function LessonDone({ unitId, part, content, correct, total, outcomes, onAgain }: Props) {
  const { target, m, refreshCourse } = useApp();
  const { streak, reload } = useProgress();
  const [saved, setSaved] = useState<Saved | null>(null);
  const [failed, setFailed] = useState(false);
  const sent = useRef(false);

  useEffect(() => {
    // Effects run twice in development; save the attempt only once.
    if (sent.current || !target) return;
    sent.current = true;
    (async () => {
      const { data, error } = await getSupabaseBrowserClient()
        .rpc("complete_lesson", {
          p_target_lang: target,
          p_unit_id: unitId,
          p_part: part,
          p_correct: correct,
          p_total: total,
          p_words: part === "words" ? content.words.map(({ word, meaning, romanization }) => ({ word, meaning, romanization })) : [],
          p_sentences: part === "sentences" ? content.sentences.map(({ text, meaning, tokens }) => ({ text, meaning, tokens })) : [],
        })
        .single<Saved>();
      if (error || !data) throw error ?? new Error("No result");
      setSaved(data);
      await Promise.all([refreshCourse(), reload()]);
    })().catch((error: unknown) => {
      console.error("Could not save lesson", error);
      setFailed(true);
    });
  }, [target, unitId, part, correct, total, content.words, content.sentences, refreshCourse, reload]);

  // Until the server answers, show the same numbers it will compute.
  const stars = saved?.stars ?? starsFor(correct, total);
  const points = saved?.points ?? pointsFor(correct, total);
  const next = nextStep(unitId, part);
  const title = part === "words" ? m.done.titleWords : part === "sentences" ? m.done.titleSentences : m.done.titleTest;
  const newLabel = part === "words" ? m.done.newWords : m.done.newSentences;

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center gap-6 px-4 py-10 text-center">
      <span className="relative inline-block animate-tada text-7xl" aria-hidden>
        🎉
        <Confetti pieces={36} />
      </span>
      <h1 className="font-display text-4xl font-bold">{title}</h1>

      <p role="img" aria-label={fmt(m.map.stars, { n: stars })} className="flex gap-4 text-6xl">
        {[0, 1, 2].map((i) => (
          <span key={i} aria-hidden className={`inline-block animate-star ${i < stars ? "" : "opacity-20 grayscale"}`} style={{ animationDelay: `${300 + i * 200}ms` }}>
            ⭐
          </span>
        ))}
      </p>

      <dl className="grid w-full grid-cols-3 gap-3">
        {[
          { icon: "🏅", value: `+${points}`, label: m.done.points },
          { icon: "🔥", value: streak, label: m.done.streak },
          part === "test"
            ? { icon: "🎯", value: `${correct}/${total}`, label: m.done.correctAnswers }
            : { icon: part === "words" ? "📖" : "💬", value: saved?.new_items ?? "…", label: newLabel },
        ].map((stat, i) => (
          <Card key={stat.label} className="animate-pop flex flex-col items-center p-3" style={{ animationDelay: `${900 + i * 100}ms` }}>
            <dt className="order-2 text-xs text-muted">{stat.label}</dt>
            <dd className="order-1 font-display text-2xl font-bold">
              <span aria-hidden>{stat.icon} </span>
              {stat.value}
            </dd>
          </Card>
        ))}
      </dl>

      {!saved && !failed && <p className="text-muted" role="status">{m.done.saving}</p>}
      {failed && <Notice tone="error">{m.done.saveError}</Notice>}

      {target && <ReviewList items={outcomes} target={target} m={m} />}

      <div className="animate-pop flex w-full items-center gap-3 rounded-3xl border-2 border-ink bg-sun-soft p-4 text-left" style={{ animationDelay: "1200ms" }}>
        <Mascot className="animate-float" />
        <p className="font-semibold">
          {fmt(m.done.buddyGreat, { unit: content.title })}{" "}
          {next ? fmt(m.done.buddyNext, { unit: next.part === "words" ? m.units[next.unit] : m.units[unitId] }) : m.done.buddyAll}
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        {next ? (
          <ButtonLink href={`/lesson/${next.unit}/${next.part}`} className="sm:col-span-2">
            {next.part === "sentences" ? m.done.nextSentences : next.part === "test" ? m.done.nextTest : fmt(m.done.nextUnit, { unit: m.units[next.unit] })} →
          </ButtonLink>
        ) : (
          <ButtonLink href="/map" className="sm:col-span-2">{m.done.continue} →</ButtonLink>
        )}
        <Button variant="secondary" onClick={onAgain}>
          {m.done.practiseAgain}
        </Button>
        <ButtonLink href="/map" variant="secondary">{m.done.toMap}</ButtonLink>
      </div>
    </main>
  );
}
