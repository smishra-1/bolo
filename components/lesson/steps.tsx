"use client";

import { useEffect, useEffectEvent, useState, type ReactNode } from "react";
import { fmt, type Messages } from "@/lib/i18n";
import type { TargetLang } from "@/lib/languages";
import { joinTokens, sentenceReading, withReading, type BuildStep, type CardStep, type ChoiceStep, type ListenStep, type MatchStep, type SentenceCardStep } from "@/lib/lesson";
import { speak } from "@/lib/client/speech";
import { Button, Notice } from "../ui";

/** What the feedback popup needs to explain an answer. */
export type StepOutcome = {
  correct: boolean;
  question: string;
  correctAnswer: string;
  learnerAnswer: string | null;
  lines: string[];
  /** The learner chose not to answer. */
  skipped?: boolean;
  /** Wrong tries before finishing (match step). */
  mistakes?: number;
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

/** A word with its English-letter reading underneath, when it has one. */
function Reading({ word, roman }: { word: string; roman?: string | null }) {
  return (
    <>
      {word}
      {roman && <span className="font-sans text-sm font-normal text-muted">{roman}</span>}
    </>
  );
}

export function MatchStepView({ step, target, m, onDone }: StepProps<MatchStep>) {
  const [word, setWord] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);

  const meaningOf = (w: string) => step.pairs.find((p) => p.word === w)?.meaning;
  const lines = step.pairs.map((p) => `${quote(withReading(p.word, step.romans[p.word]))} ${fmt(m.lesson.means, { meaning: p.meaning })}`);

  function pickMeaning(meaning: string) {
    if (!word) return;
    if (meaningOf(word) === meaning) {
      const next = [...matched, word];
      setMatched(next);
      setWord(null);
      if (next.length === step.pairs.length) {
        onDone({ correct: mistakes <= 1, question: m.lesson.matchTitle, correctAnswer: lines.join("; "), learnerAnswer: null, lines, mistakes });
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
                <Reading word={w} roman={step.romans[w]} />
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
      correctAnswer: withReading(step.answer, step.romans[step.answer]),
      learnerAnswer: withReading(picked, step.romans[picked]),
      lines: [`${quote(withReading(step.answer, step.romans[step.answer]))} ${fmt(m.lesson.means, { meaning: step.meaning })}`],
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
            <Reading word={option} roman={step.romans[option]} />
          </OptionButton>
        ))}
      </div>
    </StepFrame>
  );
}

export function ListenStepView({ step, target, m, onDone }: StepProps<ListenStep>) {
  const [picked, setPicked] = useState<string | null>(null);
  const [noVoice, setNoVoice] = useState(false);
  const check = () => {
    if (!picked) return;
    onDone({
      correct: picked === step.answer,
      question: `${m.lesson.listenTitle}: ${quote(withReading(step.word, step.romanization))}`,
      correctAnswer: step.answer,
      learnerAnswer: picked,
      lines: [`${quote(withReading(step.word, step.romanization))} ${fmt(m.lesson.means, { meaning: step.answer })}`],
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
      <Button variant="secondary" className="self-center px-8 py-6 text-2xl" onClick={async () => setNoVoice(!(await speak(step.word, target)))}>
        <span aria-hidden>🔊</span> {m.lesson.tapToListen}
      </Button>
      {noVoice && <Notice tone="error">{m.common.noVoice}</Notice>}
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

/** Tap the tiles in order to build the sentence; tap a placed tile to take it back. */
export function BuildStepView({ step, target, m, onDone }: StepProps<BuildStep>) {
  const [placed, setPlaced] = useState<number[]>([]);
  const [noVoice, setNoVoice] = useState(false);
  const reading = sentenceReading(step.answer);

  useEffect(() => {
    if (step.listen) speak(step.text, target);
  }, [step.listen, step.text, target]);

  const free = step.bank.map((_, i) => i).filter((i) => !placed.includes(i));
  const built = placed.map((i) => step.bank[i]);
  const question = step.listen ? m.lesson.buildListenTitle : `${m.lesson.buildHelp} ${quote(step.meaning)}`;

  const check = () => {
    if (placed.length === 0) return;
    speak(step.text, target);
    onDone({
      correct: built.length === step.answer.length && built.every((t, i) => t.text === step.answer[i].text),
      question,
      correctAnswer: withReading(step.text, reading),
      learnerAnswer: joinTokens(built, step.text),
      lines: [`${quote(withReading(step.text, reading))} ${fmt(m.lesson.means, { meaning: step.meaning })}`],
    });
  };

  const tile = (index: number, where: "bank" | "line") => {
    const t = step.bank[index];
    return (
      <button
        key={`${where}-${index}`}
        type="button"
        lang={target}
        aria-label={where === "line" ? `${t.text}: ${m.lesson.takeBack}` : t.text}
        onClick={() => setPlaced((p) => (where === "bank" ? [...p, index] : p.filter((i) => i !== index)))}
        className="chunky press flex min-h-14 min-w-16 flex-col items-center justify-center rounded-2xl bg-white px-4 py-1 font-display text-xl font-semibold hover:bg-sky-50"
      >
        {t.text}
        {t.romanization && <span className="font-sans text-xs font-normal text-muted">{t.romanization}</span>}
      </button>
    );
  };

  return (
    <StepFrame
      title={step.listen ? m.lesson.buildListenTitle : m.lesson.buildTitle}
      help={step.listen ? undefined : fmt(m.lesson.buildSub, { lang: m.languages[target] })}
      hint={m.lesson.buildHint}
      hintLabel={m.lesson.hint}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setPlaced([])} disabled={placed.length === 0}>
            {m.lesson.clear}
          </Button>
          <CheckButton m={m} disabled={placed.length === 0} onClick={check} />
        </div>
      }
    >
      {step.listen ? (
        <div className="flex flex-col items-center gap-2">
          <Button variant="secondary" className="px-8 py-6 text-2xl" onClick={async () => setNoVoice(!(await speak(step.text, target)))}>
            <span aria-hidden>🔊</span> {m.lesson.tapToListen}
          </Button>
          {noVoice && <Notice tone="error">{m.common.noVoice}</Notice>}
        </div>
      ) : (
        <p className="text-center font-display text-2xl font-semibold">{quote(step.meaning)}</p>
      )}
      <div aria-label={m.lesson.yourSentence} className="flex min-h-20 flex-wrap items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink bg-sky-50 p-3">
        {placed.length === 0 ? <span className="text-muted">{m.lesson.tapWords}</span> : placed.map((i) => tile(i, "line"))}
      </div>
      <div aria-label={m.lesson.wordBank} className="flex flex-wrap items-center justify-center gap-2">
        {free.map((i) => tile(i, "bank"))}
      </div>
    </StepFrame>
  );
}

/** A new word: look, listen, then move on. Not scored. */
export function CardStepView({ step, target, m, onNext }: { step: CardStep; target: TargetLang; m: Messages; onNext: () => void }) {
  const [noVoice, setNoVoice] = useState(false);
  useEffect(() => {
    speak(step.word, target);
  }, [step.word, target]);

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="text-sm font-semibold tracking-wide text-muted uppercase">{m.lesson.cardTitle}</p>
      <span className="text-8xl" aria-hidden>{step.emoji}</span>
      <p lang={target} className="font-display text-6xl font-bold">{step.word}</p>
      {step.romanization && <p className="text-2xl font-semibold text-brand">{step.romanization}</p>}
      <p className="font-display text-3xl">{quote(step.meaning)}</p>
      <Button variant="secondary" onClick={async () => setNoVoice(!(await speak(step.word, target)))}>
        <span aria-hidden>🔊</span> {m.lesson.tapToHear}
      </Button>
      {noVoice && <Notice tone="error">{m.common.noVoice}</Notice>}
      <Button onClick={onNext} className="mt-2 min-w-40">
        {m.lesson.gotIt} →
      </Button>
    </div>
  );
}

/** A new sentence, shown tile by tile so its parts are clear. Not scored. */
export function SentenceCardView({ step, target, m, onNext }: { step: SentenceCardStep; target: TargetLang; m: Messages; onNext: () => void }) {
  const [noVoice, setNoVoice] = useState(false);
  const { sentence } = step;
  const reading = sentenceReading(sentence.tokens);
  useEffect(() => {
    speak(sentence.text, target);
  }, [sentence.text, target]);

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="text-sm font-semibold tracking-wide text-muted uppercase">{m.lesson.sentenceCardTitle}</p>
      <ul lang={target} className="flex flex-wrap justify-center gap-2" aria-label={sentence.text}>
        {sentence.tokens.map((t, i) => (
          <li key={`${t.text}-${i}`} className="chunky flex min-w-16 flex-col items-center rounded-2xl bg-white px-4 py-2 font-display text-2xl font-semibold">
            {t.text}
            {t.romanization && <span className="font-sans text-xs font-normal text-muted">{t.romanization}</span>}
          </li>
        ))}
      </ul>
      {reading && <p className="text-xl font-semibold text-brand">{reading}</p>}
      <p className="font-display text-2xl">{quote(sentence.meaning)}</p>
      <Button variant="secondary" onClick={async () => setNoVoice(!(await speak(sentence.text, target)))}>
        <span aria-hidden>🔊</span> {m.lesson.tapToHear}
      </Button>
      {noVoice && <Notice tone="error">{m.common.noVoice}</Notice>}
      <Button onClick={onNext} className="mt-2 min-w-40">
        {m.lesson.gotIt} →
      </Button>
    </div>
  );
}
