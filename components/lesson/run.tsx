"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { fmt, type Messages } from "@/lib/i18n";
import type { TargetLang } from "@/lib/languages";
import type { LessonStep } from "@/lib/lesson";
import { useApp } from "../app-provider";
import { ProgressBar } from "../ui";
import { FeedbackSheet } from "./feedback-sheet";
import { SayStepView } from "./say-step";
import { BuildStepView, CardStepView, ChoiceStepView, ListenStepView, MatchStepView, SentenceCardView, type StepOutcome } from "./steps";

const STEP_ICON: Record<LessonStep["type"], string> = { card: "🃏", sentenceCard: "💬", match: "🧩", choice: "👆", listen: "🔊", say: "🎤", build: "🧱" };

function stepTitle(step: LessonStep, m: Messages): string {
  switch (step.type) {
    case "card": return m.lesson.cardTitle;
    case "sentenceCard": return m.lesson.sentenceCardTitle;
    case "match": return m.lesson.matchTitle;
    case "choice": return m.lesson.choiceTitle;
    case "listen": return m.lesson.listenTitle;
    case "say": return m.lesson.sayTitle;
    case "build": return m.lesson.buildTitle;
  }
}

type Props = {
  steps: LessonStep[];
  target: TargetLang;
  onFinish: (correct: number, outcomes: StepOutcome[]) => void;
  /** Where the ✕ goes. Without it, the ✕ leaves for the map. */
  onQuit?: () => void;
};

/** Plays a list of steps one at a time, scoring every step except the cards. */
export function Run({ steps, target, onFinish, onQuit }: Props) {
  const { native, m } = useApp();
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [outcome, setOutcome] = useState<StepOutcome | null>(null);
  const [history, setHistory] = useState<StepOutcome[]>([]);

  const step = steps[index];
  const upcoming = steps.slice(index + 1, index + 3);

  const advance = useCallback(
    (result: StepOutcome | null) => {
      const total = correct + (result?.correct ? 1 : 0);
      const all = result ? [...history, result] : history;
      setOutcome(null);
      setCorrect(total);
      setHistory(all);
      if (index + 1 >= steps.length) onFinish(total, all);
      else setIndex(index + 1);
    },
    [correct, history, index, steps.length, onFinish],
  );

  const onDone = (result: StepOutcome) => {
    // Speaking has its own inline feedback, so it skips the popup.
    if (step.type === "say") advance(result);
    else setOutcome(result);
  };

  const props = { target, m, onDone };
  const label = fmt(m.lesson.stepOf, { n: index + 1, total: steps.length });
  const quit = "grid size-10 place-items-center rounded-full text-2xl text-muted hover:bg-white";

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 px-4 py-4">
      <header className="flex items-center gap-4">
        {onQuit ? (
          <button type="button" onClick={onQuit} aria-label={m.lesson.quit} className={quit}>✕</button>
        ) : (
          <Link href="/map" aria-label={m.lesson.quit} className={quit}>✕</Link>
        )}
        <ProgressBar value={index / steps.length} label={label} />
        <span className="shrink-0 text-sm font-semibold text-muted">{label}</span>
      </header>

      <div className="grid flex-1 gap-6 md:grid-cols-[1fr_220px]">
        <main key={index} className="chunky animate-slide-in rounded-3xl bg-white p-5 sm:p-8">
          {step.type === "card" && <CardStepView step={step} target={target} m={m} onNext={() => advance(null)} />}
          {step.type === "sentenceCard" && <SentenceCardView step={step} target={target} m={m} onNext={() => advance(null)} />}
          {step.type === "match" && <MatchStepView step={step} {...props} />}
          {step.type === "choice" && <ChoiceStepView step={step} {...props} />}
          {step.type === "listen" && <ListenStepView step={step} {...props} />}
          {step.type === "say" && <SayStepView step={step} {...props} />}
          {step.type === "build" && <BuildStepView step={step} {...props} />}
        </main>

        {upcoming.length > 0 && (
          <aside aria-label={m.lesson.comingUp} className="hidden flex-col gap-3 md:flex">
            <p className="text-sm font-semibold text-muted">{m.lesson.comingUp}</p>
            {upcoming.map((s, i) => (
              <div key={index + i} className="animate-slide-in rounded-2xl border-2 border-dashed border-ink/50 p-4 text-muted" style={{ animationDelay: `${80 + i * 60}ms` }}>
                <span aria-hidden>{STEP_ICON[s.type]} </span>
                {stepTitle(s, m)}
              </div>
            ))}
          </aside>
        )}
      </div>

      {outcome && <FeedbackSheet outcome={outcome} target={target} native={native} m={m} onNext={() => advance(outcome)} />}
    </div>
  );
}
