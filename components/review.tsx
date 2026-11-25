"use client";

import { fmt, type Messages } from "@/lib/i18n";
import type { TargetLang } from "@/lib/languages";
import type { StepOutcome } from "./lesson/steps";

type Props = { items: StepOutcome[]; target: TargetLang; m: Messages };

/**
 * Question-by-question look back at an assessment: what the learner answered,
 * what was right, and what to fix. Used after the quick check and after lessons.
 */
export function ReviewList({ items, target, m }: Props) {
  const correct = items.filter((i) => i.correct).length;
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="review-title" className="flex w-full flex-col gap-3 text-left">
      <div className="text-center">
        <h2 id="review-title" className="font-display text-2xl font-bold">
          {m.review.title}
        </h2>
        <p className="font-semibold text-muted">
          {fmt(m.review.score, { correct, total: items.length })}
          {correct === items.length && ` · ${m.review.allRight}`}
        </p>
      </div>

      <ol className="flex flex-col gap-3">
        {items.map((item, i) => (
          <li
            key={i}
            className={`animate-pop rounded-2xl border-2 border-ink p-4 ${item.correct ? "bg-yay-soft" : "bg-oops-soft"}`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start gap-3">
              <span aria-hidden className="text-2xl">{item.correct ? "✅" : "❌"}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  <span className="sr-only">{item.correct ? m.review.right : m.review.wrong}: </span>
                  {item.question}
                </p>
                {!item.correct && (
                  <ul className="mt-1 flex flex-col gap-0.5" lang={target}>
                    {item.skipped ? (
                      <li className="text-muted">{m.review.skipped}</li>
                    ) : item.learnerAnswer === "" ? (
                      <li className="text-muted">{m.review.heardNothing}</li>
                    ) : item.learnerAnswer ? (
                      <li>{fmt(m.review.yourAnswer, { answer: item.learnerAnswer })}</li>
                    ) : null}
                    {item.mistakes ? <li className="text-muted">{fmt(m.review.mistakes, { n: item.mistakes })}</li> : null}
                    <li className="font-semibold">{fmt(m.review.correctAnswer, { answer: item.correctAnswer })}</li>
                  </ul>
                )}
                {item.correct && item.lines.length > 0 && (
                  <ul className="mt-1 text-muted" lang={target}>
                    {item.lines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
