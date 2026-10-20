"use client";

import { useEffect, useEffectEvent, useState, type ReactNode } from "react";
import { fmt, type Messages } from "@/lib/i18n";
import type { TargetLang } from "@/lib/languages";
import type { ChoiceStep, FillStep, ListenStep, MatchStep } from "@/lib/lesson";
import { speak } from "@/lib/client/speech";
import { Button } from "../ui";

/** What the feedback popup needs to explain an answer. */
export type StepOutcome = {
  correct: boolean;
  question: string;
  correctAnswer: string;
  learnerAnswer: string | null;
  lines: string[];
};

export type StepProps<S> = {
  step: S;
  target: TargetLang;
  m: Messages;
  onDone: (outcome: StepOutcome) => void;
};

type FrameProps = { title: string; help?: string; hint: string; hintLabel: string; children: ReactNode; footer: ReactNode };

function StepFrame({ title, help, hint, hintLabel, children, footer }: FrameProps) {
  const [showHint, setShowHint] = useState(false);
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="font-display text-3xl font-bold">{title}</h2>
        {help && <p className="text-muted">{help}</p>}
      </div>
      {children}
      {showHint && (
        <p role="status" className="rounded-2xl border-2 border-dashed border-ink bg-sun-soft px-4 py-2 text-center">
          💡 {hint}
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <Button variant="secondary" onClick={() => setShowHint(true)} disabled={showHint}>
          <span aria-hidden>💡</span> {hintLabel}
        </Button>
        {footer}
      </div>
    </div>
  );
}

/**
 * Lets keyboard players pick option N with the number keys and press Enter to check.
 * Ignored while the feedback dialog is open or while typing in a field.
 */
function useStepKeys(count: number, onPick: (index: number) => void, onCheck: () => void) {
  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
    if (document.querySelector('[role="dialog"]')) return;
    const el = event.target as HTMLElement;
    if (el.closest("input, textarea, select")) return;
    const n = Number(event.key);
    if (Number.isInteger(n) && n >= 1 && n <= count) {
      event.preventDefault();
      onPick(n - 1);
    } else if (event.key === "Enter" && !el.closest("button, a")) {
      event.preventDefault();
      onCheck();
    }
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKey(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
}

type OptionProps = { selected: boolean; onClick: () => void; children: ReactNode; tone?: "yay" | "oops"; shortcut?: number };

function OptionButton({ selected, onClick, children, tone, shortcut }: OptionProps) {
  const bg = tone === "yay" ? "bg-yay-soft" : tone === "oops" ? "bg-oops-soft animate-shake" : selected ? "bg-sky-100" : "bg-white hover:bg-sky-50";
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-keyshortcuts={shortcut ? String(shortcut) : undefined}
      onClick={onClick}
      className={`chunky press relative flex min-h-14 w-full flex-col items-center justify-center rounded-2xl px-4 py-2 font-display text-xl font-semibold ${bg} ${selected ? "ring-3 ring-brand ring-offset-2" : ""}`}
    >
      {shortcut && (
        <span aria-hidden className="absolute top-1.5 left-2 hidden font-sans text-xs font-bold text-muted [@media(hover:hover)]:block">
          {shortcut}
        </span>
      )}
      {children}
    </button>
  );
}

const quote = (s: string) => `“${s}”`;

export function MatchStepView({ step, target, m, onDone }: StepProps<MatchStep>) {
  const [word, setWord] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);

  const meaningOf = (w: string) => step.pairs.find((p) => p.word === w)?.meaning;
  const lines = step.pairs.map((p) => `${quote(p.word)} ${fmt(m.lesson.means, { meaning: p.meaning })}`);

  function pickMeaning(meaning: string) {
    if (!word) return;
    if (meaningOf(word) === meaning) {
      const next = [...matched, word];
      setMatched(next);
      setWord(null);
      if (next.length === step.pairs.length) {
        onDone({ correct: mistakes <= 1, question: m.lesson.matchTitle, correctAnswer: lines.join("; "), learnerAnswer: null, lines });
      }
    } else {
      setMistakes((n) => n + 1);
      setWrong(meaning);
      setTimeout(() => setWrong(null), 600);
    }
  }

  return (
    <StepFrame
      title={m.lesson.matchTitle}
      help={fmt(m.lesson.matchHelp, { lang: m.languages[target] })}
      hint={m.lesson.matchHint}
      hintLabel={m.lesson.hint}
      footer={null}
    >
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        <ul className="flex flex-col gap-3">
          {step.pairs.map(({ word: w }) => (
            <li key={w}>
              <OptionButton
                selected={word === w}
                tone={matched.includes(w) ? "yay" : undefined}
                onClick={() => {
                  if (matched.includes(w)) return;
                  setWord(w);
                  speak(w, target);
                }}
              >
                {w}
              </OptionButton>
            </li>
          ))}
        </ul>
        <ul className="flex flex-col gap-3">
          {step.meanings.map((meaning) => {
            const done = step.pairs.some((p) => p.meaning === meaning && matched.includes(p.word));
            return (
              <li key={meaning}>
                <OptionButton selected={false} tone={done ? "yay" : wrong === meaning ? "oops" : undefined} onClick={() => !done && pickMeaning(meaning)}>
                  {meaning}
                </OptionButton>
              </li>
            );
          })}
        </ul>
      </div>
    </StepFrame>
  );
}

function CheckButton({ disabled, onClick, m }: { disabled: boolean; onClick: () => void; m: Messages }) {
  return (
    <Button onClick={onClick} disabled={disabled} className="min-w-36">
      {m.common.check}
    </Button>
  );
}

export function ChoiceStepView({ step, target, m, onDone }: StepProps<ChoiceStep>) {
  const [picked, setPicked] = useState<string | null>(null);
  const question = `${fmt(m.lesson.choiceHelp, { lang: m.languages[target] })} ${quote(step.meaning)}`;
  const pick = (option: string) => {
    setPicked(option);
    speak(option, target);
  };
  const check = () => {
    if (!picked) return;
    onDone({
      correct: picked === step.answer,
      question,
      correctAnswer: step.answer,
      learnerAnswer: picked,
      lines: [`${quote(step.answer)} ${fmt(m.lesson.means, { meaning: step.meaning })}`],
    });
  };
  useStepKeys(step.options.length, (i) => pick(step.options[i]), check);
  return (
    <StepFrame
      title={m.lesson.choiceTitle}
      help={fmt(m.lesson.choiceHelp, { lang: m.languages[target] })}
      hint={m.lesson.choiceHint}
      hintLabel={m.lesson.hint}
      footer={<CheckButton m={m} disabled={!picked} onClick={check} />}
    >
      <div className="flex flex-col items-center gap-2">
        <span className="text-7xl" aria-hidden>{step.emoji}</span>
        <p className="font-display text-2xl font-semibold">{quote(step.meaning)}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {step.options.map((option, i) => (
          <OptionButton key={option} shortcut={i + 1} selected={picked === option} onClick={() => pick(option)}>
            {option}
          </OptionButton>
        ))}
      </div>
    </StepFrame>
  );
}

export function ListenStepView({ step, target, m, onDone }: StepProps<ListenStep>) {
  const [picked, setPicked] = useState<string | null>(null);
  const check = () => {
    if (!picked) return;
    onDone({
      correct: picked === step.answer,
      question: `${m.lesson.listenTitle}: ${quote(step.word)}`,
      correctAnswer: step.answer,
      learnerAnswer: picked,
      lines: [`${quote(step.word)} ${fmt(m.lesson.means, { meaning: step.answer })}`],
    });
  };
  useStepKeys(step.options.length, (i) => setPicked(step.options[i].meaning), check);

  useEffect(() => {
    speak(step.word, target);
  }, [step.word, target]);

  return (
    <StepFrame
      title={m.lesson.listenTitle}
      hint={m.lesson.listenHint}
      hintLabel={m.lesson.hint}
      footer={<CheckButton m={m} disabled={!picked} onClick={check} />}
    >
      <Button variant="secondary" className="self-center px-8 py-6 text-2xl" onClick={() => speak(step.word, target)}>
        <span aria-hidden>🔊</span> {m.lesson.tapToListen}
      </Button>
      <div className="grid grid-cols-3 gap-3">
        {step.options.map((option, i) => (
          <OptionButton key={option.meaning} shortcut={i + 1} selected={picked === option.meaning} onClick={() => setPicked(option.meaning)}>
            <span className="text-4xl" aria-hidden>{option.emoji}</span>
            <span className="text-base">{option.meaning}</span>
          </OptionButton>
        ))}
      </div>
    </StepFrame>
  );
}

export function FillStepView({ step, target, m, onDone }: StepProps<FillStep>) {
  const [picked, setPicked] = useState<string | null>(null);
  const full = `${step.before}${step.answer}${step.after}`;
  const check = () => {
    if (!picked) return;
    speak(full, target);
    onDone({
      correct: picked === step.answer,
      question: `${m.lesson.fillTitle}: ${step.before}___${step.after}`,
      correctAnswer: step.answer,
      learnerAnswer: picked,
      lines: [`${quote(full)} ${fmt(m.lesson.means, { meaning: step.meaning })}`],
    });
  };
  useStepKeys(step.options.length, (i) => setPicked(step.options[i]), check);
  return (
    <StepFrame
      title={m.lesson.fillTitle}
      hint={fmt(m.lesson.fillHint, { meaning: step.meaning })}
      hintLabel={m.lesson.hint}
      footer={<CheckButton m={m} disabled={!picked} onClick={check} />}
    >
      <p className="text-center font-display text-3xl leading-relaxed font-semibold">
        {step.before}
        <span className={`mx-1 inline-block min-w-20 border-b-4 px-2 ${picked ? "border-brand text-brand" : "border-ink"}`}>{picked ?? " "}</span>
        {step.after}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {step.options.map((option, i) => (
          <div key={option} className="min-w-28">
            <OptionButton shortcut={i + 1} selected={picked === option} onClick={() => setPicked(option)}>
              {option}
            </OptionButton>
          </div>
        ))}
      </div>
    </StepFrame>
  );
}
