"use client";

import { useEffect, useState } from "react";
import { fmt } from "@/lib/i18n";
import { starsFor } from "@/lib/progress";
import type { TargetLang } from "@/lib/languages";
import type { LessonStep } from "@/lib/lesson";
import {
  MIN_WORDS_FOR_TEST,
  buildSentencePractice,
  buildWordPractice,
  parseLearnedSentence,
  type LearnedSentence,
  type LearnedWord,
} from "@/lib/practice";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useApp } from "../app-provider";
import { BottomNav, TopBar } from "../app-shell";
import { Run } from "../lesson/run";
import type { StepOutcome } from "../lesson/steps";
import { ReviewList } from "../review";
import { Button, Card, Notice, Stars } from "../ui";

// Plenty for a varied test; the newest are the freshest in memory.
const LIMIT = 200;

type Phase =
  | { kind: "menu" }
  | { kind: "run"; id: number; steps: LessonStep[]; again: () => LessonStep[] }
  | { kind: "result"; correct: number; total: number; outcomes: StepOutcome[]; again: () => LessonStep[] };

type Learned = { words: LearnedWord[]; sentences: LearnedSentence[] };

export function Practice() {
  const { target } = useApp();
  // CourseGate guarantees a target; reload what was learned when it changes.
  return <PracticeView key={target} target={target as TargetLang} />;
}

function PracticeView({ target }: { target: TargetLang }) {
  const { m } = useApp();
  const [learned, setLearned] = useState<Learned | null>(null);
  const [failed, setFailed] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: "menu" });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let cancelled = false;
    // RLS limits both queries to the signed-in learner's rows.
    Promise.all([
      supabase
        .from("learned_words")
        .select("word, meaning, romanization")
        .eq("target_lang", target)
        .order("first_seen_at", { ascending: false })
        .limit(LIMIT),
      supabase
        .from("learned_sentences")
        .select("sentence, meaning, tokens")
        .eq("target_lang", target)
        .order("first_seen_at", { ascending: false })
        .limit(LIMIT),
    ])
      .then(async ([w, s]) => {
        if (cancelled) return;
        let words = w.data as LearnedWord[] | null;
        // Until the readings migration has run there is no readings column.
        if (w.error) {
          const plain = await supabase.from("learned_words").select("word, meaning").eq("target_lang", target).limit(LIMIT);
          if (plain.error) throw plain.error;
          words = (plain.data ?? []).map((row) => ({ ...row, romanization: null }));
        }
        if (s.error) console.error("Could not load sentences", s.error);
        const sentences = (s.data ?? []).flatMap((row) => parseLearnedSentence(row) ?? []);
        if (!cancelled) setLearned({ words: words ?? [], sentences });
      })
      .catch((error: unknown) => {
        console.error("Could not load practice", error);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [target]);

  const start = (again: () => LessonStep[]) => setPhase({ kind: "run", id: Date.now(), steps: again(), again });

  if (phase.kind === "run") {
    return (
      <Run
        key={phase.id}
        steps={phase.steps}
        target={target}
        onQuit={() => setPhase({ kind: "menu" })}
        onFinish={(correct, outcomes) => setPhase({ kind: "result", correct, total: outcomes.length, outcomes, again: phase.again })}
      />
    );
  }

  if (phase.kind === "result") {
    const stars = starsFor(phase.correct, phase.total);
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center gap-6 px-4 py-10 text-center">
        <h1 className="font-display text-4xl font-bold">{m.practice.resultTitle}</h1>
        <Stars count={stars} label={fmt(m.map.stars, { n: stars })} size="text-5xl" />
        <ReviewList items={phase.outcomes} target={target} m={m} />
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
          <Button onClick={() => start(phase.again)}>{m.done.practiseAgain}</Button>
          <Button variant="secondary" onClick={() => setPhase({ kind: "menu" })}>{m.practice.back}</Button>
        </div>
      </main>
    );
  }

  const words = learned?.words ?? [];
  const sentences = learned?.sentences ?? [];
  const canWords = words.length >= MIN_WORDS_FOR_TEST;
  const canSentences = sentences.length >= 1;

  return (
    <>
      <TopBar />
      <main className="mx-auto flex max-w-2xl flex-col gap-5 px-4 pt-6 pb-28">
        <div>
          <h1 className="font-display text-3xl font-bold">🎯 {m.practice.title}</h1>
          <p className="text-muted">{m.practice.subtitle}</p>
        </div>

        {failed && <Notice tone="error">{m.common.errorGeneric}</Notice>}
        {!learned && !failed && <p className="text-muted">{m.common.loading}</p>}

        {learned && (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <li>
              <Card className="animate-pop flex h-full flex-col items-center gap-2 p-5 text-center">
                <span className="text-5xl" aria-hidden>📖</span>
                <h2 className="font-display text-2xl font-semibold">{m.practice.wordsTitle}</h2>
                <p className="text-sm text-muted">{fmt(m.practice.wordsCount, { n: words.length })}</p>
                <Button className="mt-auto w-full" disabled={!canWords} onClick={() => start(() => buildWordPractice(words))}>
                  {m.practice.start} →
                </Button>
                {!canWords && <p className="text-sm text-muted">{fmt(m.practice.needWords, { n: MIN_WORDS_FOR_TEST })}</p>}
              </Card>
            </li>
            <li>
              <Card className="animate-pop flex h-full flex-col items-center gap-2 p-5 text-center" style={{ animationDelay: "90ms" }}>
                <span className="text-5xl" aria-hidden>🧱</span>
                <h2 className="font-display text-2xl font-semibold">{m.practice.sentencesTitle}</h2>
                <p className="text-sm text-muted">{fmt(m.practice.sentencesCount, { n: sentences.length })}</p>
                <Button className="mt-auto w-full" disabled={!canSentences} onClick={() => start(() => buildSentencePractice(sentences))}>
                  {m.practice.start} →
                </Button>
                {!canSentences && <p className="text-sm text-muted">{m.practice.needSentences}</p>}
              </Card>
            </li>
          </ul>
        )}
      </main>
      <BottomNav />
    </>
  );
}
