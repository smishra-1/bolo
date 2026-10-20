"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { errorMessage, postJson } from "@/lib/client/api";
import { fmt, type Messages } from "@/lib/i18n";
import type { TargetLang } from "@/lib/languages";
import { buildLessonSteps, type LessonContent, type LessonStep } from "@/lib/lesson";
import type { UnitId } from "@/lib/units";
import { useApp } from "../app-provider";
import { Button, Notice, ProgressBar, Spinner } from "../ui";
import { FeedbackSheet } from "./feedback-sheet";
import { LessonDone } from "./lesson-done";
import { SayStepView } from "./say-step";
import { ChoiceStepView, FillStepView, ListenStepView, MatchStepView, type StepOutcome } from "./steps";

type Phase =
  | { kind: "loading" }
  | { kind: "error"; error: unknown }
  | { kind: "playing"; content: LessonContent; steps: LessonStep[]; round: number }
  | { kind: "done"; content: LessonContent; correct: number; total: number; round: number };

const STEP_ICON: Record<LessonStep["type"], string> = { match: "🧩", choice: "👆", listen: "🔊", fill: "✏️", say: "🎤" };

function stepTitle(step: LessonStep, m: Messages): string {
  switch (step.type) {
    case "match": return m.lesson.matchTitle;
    case "choice": return m.lesson.choiceTitle;
    case "listen": return m.lesson.listenTitle;
    case "fill": return m.lesson.fillTitle;
    case "say": return m.lesson.sayTitle;
  }
}

export function LessonPlayer({ unitId }: { unitId: UnitId }) {
  const { target, native, course, m } = useApp();
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  const level = course?.level ?? 1;

  useEffect(() => {
    if (!target) return;
    const controller = new AbortController();
    postJson<{ lesson: LessonContent }>("/api/lesson", { target, native, unit: unitId, level }, controller.signal)
      .then(({ lesson }) => setPhase({ kind: "playing", content: lesson, steps: buildLessonSteps(lesson), round: 0 }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setPhase({ kind: "error", error });
      });
    return () => controller.abort();
  }, [target, native, unitId, level, attempt]);

  const retry = () => {
    setPhase({ kind: "loading" });
    setAttempt((n) => n + 1);
  };

  if (!target) return null;

  if (phase.kind === "loading") return <Spinner label={m.lesson.loading} />;
  if (phase.kind === "error") {
    const message = errorMessage(phase.error, m);
    return (
      <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-12">
        <Notice tone="error">{message === m.common.errorGeneric ? m.lesson.loadError : message}</Notice>
        <Button onClick={retry}>{m.common.tryAgain}</Button>
        <Link href="/map" className="text-center text-muted underline">{m.lesson.quit}</Link>
      </main>
    );
  }
  if (phase.kind === "done") {
    return (
      <LessonDone
        unitId={unitId}
        content={phase.content}
        correct={phase.correct}
        total={phase.total}
        onAgain={() => setPhase({ kind: "playing", content: phase.content, steps: buildLessonSteps(phase.content), round: phase.round + 1 })}
      />
    );
  }

  return (
    <Run
      key={phase.round}
      steps={phase.steps}
      target={target}
      onFinish={(correct) => setPhase({ kind: "done", content: phase.content, correct, total: phase.steps.length, round: phase.round })}
    />
  );
}

function Run({ steps, target, onFinish }: { steps: LessonStep[]; target: TargetLang; onFinish: (correct: number) => void }) {
  const { native, m } = useApp();
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [outcome, setOutcome] = useState<StepOutcome | null>(null);

  const step = steps[index];
  const upcoming = steps.slice(index + 1, index + 3);

  const advance = useCallback(
    (wasCorrect: boolean) => {
      const total = correct + (wasCorrect ? 1 : 0);
      setOutcome(null);
      setCorrect(total);
      if (index + 1 >= steps.length) onFinish(total);
      else setIndex(index + 1);
    },
    [correct, index, steps.length, onFinish],
  );

  const onDone = (result: StepOutcome) => {
    // Speaking has its own inline feedback, so it skips the popup.
    if (step.type === "say") advance(result.correct);
    else setOutcome(result);
  };

  const props = { target, m, onDone };

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 px-4 py-4">
      <header className="flex items-center gap-4">
        <Link href="/map" aria-label={m.lesson.quit} className="grid size-10 place-items-center rounded-full text-2xl text-muted hover:bg-white">
          ✕
        </Link>
        <ProgressBar value={index / steps.length} label={fmt(m.lesson.stepOf, { n: index + 1, total: steps.length })} />
        <span className="shrink-0 text-sm font-semibold text-muted">{fmt(m.lesson.stepOf, { n: index + 1, total: steps.length })}</span>
      </header>

      <div className="grid flex-1 gap-6 md:grid-cols-[1fr_220px]">
        <main key={index} className="chunky animate-slide-in rounded-3xl bg-white p-5 sm:p-8">
          {step.type === "match" && <MatchStepView key={index} step={step} {...props} />}
          {step.type === "choice" && <ChoiceStepView key={index} step={step} {...props} />}
          {step.type === "listen" && <ListenStepView key={index} step={step} {...props} />}
          {step.type === "fill" && <FillStepView key={index} step={step} {...props} />}
          {step.type === "say" && <SayStepView key={index} step={step} {...props} />}
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

      {outcome && <FeedbackSheet outcome={outcome} target={target} native={native} m={m} onNext={() => advance(outcome.correct)} />}
    </div>
  );
}
