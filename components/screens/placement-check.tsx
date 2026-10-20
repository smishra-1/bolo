"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fmt, type Messages } from "@/lib/i18n";
import {
  PLACEMENT_LENGTH,
  buildQuestion,
  estimateLevel,
  nextDifficulty,
  type PlacementAnswer,
  type PlacementQuestion,
} from "@/lib/placement";
import type { NativeLang, TargetLang } from "@/lib/languages";
import { useApp } from "../app-provider";
import { Logo } from "../app-shell";
import { Button, Card, Confetti, Notice, ProgressBar } from "../ui";

type Pending = { picked: number | null; question: PlacementQuestion };

export function PlacementCheck() {
  const { target, native, m, setLevel } = useApp();
  // CourseGate guarantees a target language here.
  return <Check key={`${target}-${native}`} target={target as TargetLang} native={native} m={m} setLevel={setLevel} />;
}

function Check({ target, native, m, setLevel }: { target: TargetLang; native: NativeLang; m: Messages; setLevel: (level: number) => Promise<void> }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<PlacementAnswer[]>([]);
  const [question, setQuestion] = useState(() => buildQuestion(target, native, 1, []));
  const [used, setUsed] = useState<string[]>(() => [question.conceptId]);
  const [pending, setPending] = useState<Pending | null>(null);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const finished = answers.length >= PLACEMENT_LENGTH;
  const level = estimateLevel(answers);
  const levelName = m.levels[String(level) as "1" | "2" | "3"];

  function answer(picked: number | null) {
    if (pending) return;
    setPending({ picked, question });
    const correct = picked === question.answerIndex;
    const next = [...answers, { difficulty: question.difficulty, correct }];

    // Show the right answer briefly before moving on.
    setTimeout(() => {
      setAnswers(next);
      setPending(null);
      if (next.length < PLACEMENT_LENGTH) {
        const q = buildQuestion(target, native, nextDifficulty(question.difficulty, correct), used);
        setUsed((u) => [...u, q.conceptId]);
        setQuestion(q);
      }
    }, 900);
  }

  async function save(chosen: number) {
    setSaving(true);
    setFailed(false);
    try {
      await setLevel(chosen);
      router.push("/map");
    } catch (error) {
      console.error(error);
      setFailed(true);
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-4 py-4">
      <header className="flex items-center justify-between">
        <Logo />
        <button type="button" onClick={() => save(1)} disabled={saving} className="font-semibold text-muted underline-offset-4 hover:underline">
          {m.common.skip}
        </button>
      </header>

      <div>
        <p className="mb-2 text-sm font-semibold text-muted">
          {m.check.title} · {fmt(m.check.questionOf, { n: Math.min(answers.length + 1, PLACEMENT_LENGTH), total: PLACEMENT_LENGTH })}
        </p>
        <ProgressBar value={answers.length / PLACEMENT_LENGTH} label={m.check.title} />
      </div>

      {finished ? (
        <Card className="animate-pop flex flex-col items-center gap-4 p-8 text-center">
          <span className="relative inline-block animate-tada text-6xl" aria-hidden>
            🎉
            <Confetti />
          </span>
          <h1 className="font-display text-3xl font-bold">{m.check.doneTitle}</h1>
          <p className="text-lg">{fmt(m.check.doneBody, { level: levelName })}</p>
          <Button onClick={() => save(level)} disabled={saving}>
            {saving ? m.common.loading : m.check.seeMap} →
          </Button>
          {failed && <Notice tone="error">{m.common.errorGeneric}</Notice>}
        </Card>
      ) : (
        <section key={question.conceptId} className="animate-slide-in flex flex-col items-center gap-6 text-center" aria-live="polite">
          <span className="inline-block animate-float text-7xl" aria-hidden>{question.emoji}</span>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">
            {fmt(m.check.howDoYouSay, { word: question.prompt, lang: m.languages[target] })}
          </h1>
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
            {question.options.map((option, index) => {
              const reveal = pending !== null;
              const isAnswer = index === question.answerIndex;
              const isPicked = pending?.picked === index;
              const tone = reveal && isAnswer ? "bg-yay-soft" : reveal && isPicked ? "bg-oops-soft" : "bg-white";
              return (
                <button
                  key={`${question.conceptId}-${index}`}
                  type="button"
                  disabled={reveal}
                  onClick={() => answer(index)}
                  className={`chunky press flex min-h-16 flex-col items-center justify-center rounded-2xl px-4 py-3 font-display text-xl font-semibold ${tone}`}
                >
                  {option.text}
                  {option.roman && <span className="text-sm font-normal text-muted">{option.roman}</span>}
                </button>
              );
            })}
          </div>
          <button type="button" disabled={pending !== null} onClick={() => answer(null)} className="text-muted underline underline-offset-4">
            {m.check.dontKnow}
          </button>
        </section>
      )}

      <div className="mt-auto rounded-2xl border-2 border-ink bg-sun-soft px-4 py-3 text-center text-sm">
        <span aria-hidden>📈 </span>
        {m.check.adaptive}
        <br />
        <strong>{fmt(m.check.levelGuess, { level: levelName })}</strong>
      </div>
    </main>
  );
}
