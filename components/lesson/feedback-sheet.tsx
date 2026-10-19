"use client";

import { useEffect, useRef, useState } from "react";
import { errorMessage, postJson } from "@/lib/client/api";
import { fmt, type Messages } from "@/lib/i18n";
import type { NativeLang, TargetLang } from "@/lib/languages";
import { Button } from "../ui";
import type { StepOutcome } from "./steps";

type Props = {
  outcome: StepOutcome;
  target: TargetLang;
  native: NativeLang;
  m: Messages;
  onNext: () => void;
};

/** The "Yay!" or "Oops, not quite" popup shown after each answer. */
export function FeedbackSheet({ outcome, target, native, m, onNext }: Props) {
  const nextRef = useRef<HTMLButtonElement>(null);
  const [tip, setTip] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    nextRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNext]);

  async function explain() {
    setLoading(true);
    try {
      const { explanation } = await postJson<{ explanation: string }>("/api/explain", {
        target,
        native,
        question: outcome.question.slice(0, 300),
        correctAnswer: outcome.correctAnswer.slice(0, 160),
        learnerAnswer: outcome.learnerAnswer?.slice(0, 160) ?? null,
      });
      setTip(explanation);
    } catch (error) {
      setTip(errorMessage(error, m));
    } finally {
      setLoading(false);
    }
  }

  const yay = outcome.correct;
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        className={`animate-pop w-full max-w-md overflow-hidden rounded-3xl border-4 bg-white shadow-chunky ${yay ? "border-yay" : "border-oops"}`}
      >
        <div className={`flex flex-col items-center gap-1 py-4 ${yay ? "bg-yay-soft" : "bg-oops-soft"}`}>
          <span className="text-5xl" aria-hidden>{yay ? "🎉" : "🤔"}</span>
          <h2 id="feedback-title" className="font-display text-3xl font-bold">
            {yay ? m.lesson.yay : m.lesson.oops}
          </h2>
        </div>
        <div className="flex flex-col gap-4 p-5 text-center">
          {!yay && <p className="font-semibold">{fmt(m.lesson.answerIs, { answer: outcome.correctAnswer })}</p>}
          {outcome.lines.length > 0 && (
            <ul className="text-lg" lang={target}>
              {outcome.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
          {tip ? (
            <p role="status" className="rounded-2xl border-2 border-dashed border-ink bg-sun-soft px-4 py-3">
              💡 {tip}
            </p>
          ) : (
            <button
              type="button"
              onClick={explain}
              disabled={loading}
              className="rounded-2xl border-2 border-ink bg-sun-soft px-4 py-2 font-semibold disabled:opacity-60"
            >
              💡 {loading ? m.lesson.thinking : m.lesson.whyTip}
            </button>
          )}
          <Button ref={nextRef} onClick={onNext} className="w-full">
            {m.common.next} →
          </Button>
        </div>
      </div>
    </div>
  );
}
