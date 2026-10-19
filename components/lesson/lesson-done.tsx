"use client";

import { useEffect, useRef, useState } from "react";
import { useProgress } from "@/hooks/use-progress";
import { fmt } from "@/lib/i18n";
import type { LessonContent } from "@/lib/lesson";
import { nextUnit, pointsFor, starsFor } from "@/lib/progress";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UnitId } from "@/lib/units";
import { useApp } from "../app-provider";
import { Button, ButtonLink, Card, Mascot, Notice } from "../ui";

type Saved = { stars: number; points: number; new_words: number };

type Props = { unitId: UnitId; content: LessonContent; correct: number; total: number; onAgain: () => void };

export function LessonDone({ unitId, content, correct, total, onAgain }: Props) {
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
          p_correct: correct,
          p_total: total,
          p_words: content.words.map(({ word, meaning }) => ({ word, meaning })),
        })
        .single<Saved>();
      if (error || !data) throw error ?? new Error("No result");
      setSaved(data);
      await Promise.all([refreshCourse(), reload()]);
    })().catch((error: unknown) => {
      console.error("Could not save lesson", error);
      setFailed(true);
    });
  }, [target, unitId, correct, total, content.words, refreshCourse, reload]);

  // Until the server answers, show the same numbers it will compute.
  const stars = saved?.stars ?? starsFor(correct, total);
  const points = saved?.points ?? pointsFor(correct, total);
  const next = nextUnit(unitId);

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center gap-6 px-4 py-10 text-center">
      <span className="text-7xl" aria-hidden>🎉</span>
      <h1 className="font-display text-4xl font-bold">{m.done.title}</h1>

      <p role="img" aria-label={fmt(m.map.stars, { n: stars })} className="flex gap-4 text-6xl">
        {[0, 1, 2].map((i) => (
          <span key={i} aria-hidden className={`animate-pop ${i < stars ? "" : "opacity-20 grayscale"}`} style={{ animationDelay: `${i * 150}ms` }}>
            ⭐
          </span>
        ))}
      </p>

      <dl className="grid w-full grid-cols-3 gap-3">
        {[
          { icon: "🏅", value: `+${points}`, label: m.done.points },
          { icon: "🔥", value: streak, label: m.done.streak },
          { icon: "📖", value: saved?.new_words ?? "…", label: m.done.newWords },
        ].map((stat) => (
          <Card key={stat.label} className="flex flex-col items-center p-3">
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

      <div className="flex w-full items-center gap-3 rounded-3xl border-2 border-ink bg-sun-soft p-4 text-left">
        <Mascot />
        <p className="font-semibold">
          {fmt(m.done.buddyGreat, { unit: content.title })}{" "}
          {next ? fmt(m.done.buddyNext, { unit: m.units[next] }) : m.done.buddyAll}
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        <ButtonLink href="/map">{m.done.continue} →</ButtonLink>
        <Button variant="secondary" onClick={onAgain}>
          {m.done.practiseAgain}
        </Button>
      </div>
    </main>
  );
}
