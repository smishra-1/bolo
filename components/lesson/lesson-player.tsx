"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { errorMessage, postJson } from "@/lib/client/api";
import { buildSentencesLesson, buildUnitTest, buildWordsLesson, isScored, type LessonContent, type LessonStep } from "@/lib/lesson";
import { getUnit, type Part, type UnitId } from "@/lib/units";
import { useApp } from "../app-provider";
import { Button, Notice, Spinner } from "../ui";
import { LessonDone } from "./lesson-done";
import { Run } from "./run";
import type { StepOutcome } from "./steps";

type Phase =
  | { kind: "loading" }
  | { kind: "error"; error: unknown }
  | { kind: "playing"; content: LessonContent; steps: LessonStep[]; round: number }
  | { kind: "done"; content: LessonContent; correct: number; total: number; round: number; outcomes: StepOutcome[] };

function stepsFor(part: Part, content: LessonContent): LessonStep[] {
  if (part === "words") return buildWordsLesson(content);
  return part === "sentences" ? buildSentencesLesson(content) : buildUnitTest(content);
}

export function LessonPlayer({ unitId, part }: { unitId: UnitId; part: Part }) {
  const { target, native, course, m } = useApp();
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  // A later unit is harder than its first words, even for a learner placed lower.
  const level = Math.max(course?.level ?? 1, getUnit(unitId)?.tier ?? 1);

  useEffect(() => {
    if (!target) return;
    const controller = new AbortController();
    postJson<{ lesson: LessonContent }>("/api/lesson", { target, native, unit: unitId, level }, controller.signal)
      .then(({ lesson }) => setPhase({ kind: "playing", content: lesson, steps: stepsFor(part, lesson), round: 0 }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setPhase({ kind: "error", error });
      });
    return () => controller.abort();
  }, [target, native, unitId, part, level, attempt]);

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
        <Link href={`/lesson/${unitId}`} className="text-center text-muted underline">{m.lesson.quit}</Link>
      </main>
    );
  }
  if (phase.kind === "done") {
    return (
      <LessonDone
        unitId={unitId}
        part={part}
        content={phase.content}
        correct={phase.correct}
        total={phase.total}
        outcomes={phase.outcomes}
        onAgain={() => setPhase({ kind: "playing", content: phase.content, steps: stepsFor(part, phase.content), round: phase.round + 1 })}
      />
    );
  }

  return (
    <Run
      key={phase.round}
      steps={phase.steps}
      target={target}
      onFinish={(correct, outcomes) =>
        setPhase({ kind: "done", content: phase.content, correct, total: phase.steps.filter(isScored).length, round: phase.round, outcomes })
      }
    />
  );
}
