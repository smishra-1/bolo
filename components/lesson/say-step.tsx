"use client";

import { useState } from "react";
import { useRecorder } from "@/hooks/use-recorder";
import { errorMessage, transcribeAudio } from "@/lib/client/api";
import { speak } from "@/lib/client/speech";
import { fmt, type Messages } from "@/lib/i18n";
import type { TargetLang } from "@/lib/languages";
import type { SayStep } from "@/lib/lesson";
import { comparePronunciation, type PronunciationResult } from "@/lib/pronunciation";
import { Button, Notice } from "../ui";
import type { StepOutcome } from "./steps";

const PASS = 0.6;

export function SayStepView({ step, target, m, onDone }: { step: SayStep; target: TargetLang; m: Messages; onDone: (outcome: StepOutcome) => void }) {
  const [checking, setChecking] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [best, setBest] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorder = useRecorder(async (clip) => {
    setChecking(true);
    setError(null);
    try {
      const text = await transcribeAudio(clip, target);
      setHeard(text);
      const scored = comparePronunciation(step.word, text);
      setResult(scored);
      setBest((b) => Math.max(b, scored.score));
    } catch (e) {
      setError(errorMessage(e, m));
    } finally {
      setChecking(false);
    }
  });

  const recording = recorder.state === "recording";
  const micUnavailable = recorder.state === "blocked" || recorder.state === "unsupported";

  function finish() {
    onDone({
      correct: best >= PASS,
      question: m.lesson.sayTitle,
      correctAnswer: step.word,
      learnerAnswer: heard,
      lines: [],
    });
  }

  let tip: string | null = null;
  if (result && heard !== null) {
    if (!heard.trim()) tip = m.lesson.heardNothing;
    else if (result.firstMiss === null) tip = m.lesson.sayGreat;
    else tip = fmt(m.lesson.sayTryLetter, { letter: result.firstMiss });
  }

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <h2 className="font-display text-3xl font-bold">{m.lesson.sayTitle}</h2>
      <p lang={target} className="font-display text-6xl font-bold">{step.word}</p>
      <p className="text-muted">
        {step.romanization && <span className="mr-2 font-semibold">{step.romanization}</span>}({fmt(m.lesson.means, { meaning: step.meaning })})
      </p>
      <Button variant="secondary" onClick={() => speak(step.word, target, 0.7)}>
        <span aria-hidden>🔊</span> {m.lesson.listenFirst}
      </Button>

      <button
        type="button"
        onClick={recording ? recorder.stop : recorder.start}
        disabled={checking || micUnavailable}
        aria-label={recording ? m.lesson.stopRecording : m.lesson.tapAndSay}
        className={`press grid size-28 place-items-center rounded-full border-4 border-ink text-5xl shadow-chunky disabled:opacity-50 ${recording ? "bg-oops motion-safe:animate-pulse" : "bg-oops-soft"}`}
      >
        <span aria-hidden>{recording ? "⏹️" : "🎤"}</span>
      </button>
      <p className="text-muted" aria-live="polite">
        {checking ? m.lesson.checking : recording ? m.lesson.listening : m.lesson.tapAndSay}
      </p>

      {micUnavailable && <Notice tone="error">{m.lesson.micBlocked}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      {result && (
        <div className="chunky flex w-full flex-col items-center gap-3 rounded-3xl bg-white p-4 sm:flex-row" aria-live="polite">
          <ol className="flex flex-wrap justify-center gap-1.5" lang={target}>
            {result.letters.map((letter, i) => (
              <li
                key={i}
                className={`grid size-10 place-items-center rounded-lg border-2 border-ink font-display text-xl font-bold ${letter.ok ? "bg-yay-soft" : "bg-oops-soft"}`}
              >
                {letter.char}
              </li>
            ))}
          </ol>
          <div className="text-left">
            <p className="font-semibold">{tip}</p>
            {heard && <p className="text-sm text-muted">{fmt(m.lesson.heard, { text: heard })}</p>}
            <p className="text-xs text-muted">{m.lesson.sayLegend}</p>
          </div>
        </div>
      )}

      <div className="flex w-full items-center justify-between gap-3">
        <button type="button" onClick={finish} className="text-muted underline underline-offset-4">
          {m.lesson.cantSpeak}
        </button>
        <Button onClick={finish} disabled={!result || checking}>
          {m.common.next} →
        </Button>
      </div>
    </div>
  );
}
