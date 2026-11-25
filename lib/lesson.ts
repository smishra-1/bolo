import { z } from "zod";

const tokenSchema = z.object({
  text: z.string().describe("One word (or particle) of the sentence, in the target language's native script, without end punctuation"),
  romanization: z.string().nullable().describe("Latin-letter reading of this token for non-Latin scripts, else null"),
});

/** Shape the AI is asked to return. Nullable instead of optional for strict JSON schema. */
export const lessonContentSchema = z.object({
  title: z.string().describe("Short lesson title in the learner's native language"),
  words: z
    .array(
      z.object({
        word: z.string().describe("Word or short phrase in the target language, in its native script"),
        romanization: z.string().nullable().describe("Latin-letter reading for non-Latin scripts, else null"),
        meaning: z.string().describe("Meaning in the learner's native language"),
        emoji: z.string().describe("One emoji that pictures the word"),
      }),
    )
    .describe("Exactly 6 vocabulary items"),
  sentences: z
    .array(
      z.object({
        text: z.string().describe("The whole sentence as it is normally written, with its end punctuation"),
        tokens: z.array(tokenSchema).describe("The sentence split into 2-7 tokens in the correct order, so a learner can rebuild it"),
        meaning: z.string().describe("The sentence's meaning in the learner's native language"),
      }),
    )
    .describe("Exactly 4 simple sentences"),
});

export type LessonContent = z.infer<typeof lessonContentSchema>;
export type LessonWord = LessonContent["words"][number];
export type LessonSentence = LessonContent["sentences"][number];
export type Token = z.infer<typeof tokenSchema>;

const MAX_WORD = 80;
const MAX_MEANING = 120;
const MAX_SENTENCE = 160;

const clean = (s: string, max: number) => s.replace(/\s+/g, " ").trim().slice(0, max);
/** Letters only, so a sentence and its tokens can be compared whatever the spacing and punctuation. */
const letters = (s: string) => s.replace(/[\s\p{P}]/gu, "").toLocaleLowerCase();

/**
 * Trims and de-duplicates AI output and drops anything unusable. Returns null
 * when there is not enough left to build a lesson.
 */
export function normalizeLessonContent(raw: LessonContent): LessonContent | null {
  const seen = new Set<string>();
  const words: LessonWord[] = [];
  for (const w of raw.words) {
    const word = clean(w.word, MAX_WORD);
    const meaning = clean(w.meaning, MAX_MEANING);
    const key = word.toLocaleLowerCase();
    if (!word || !meaning || seen.has(key)) continue;
    seen.add(key);
    const romanization = w.romanization ? clean(w.romanization, MAX_WORD) : null;
    words.push({ word, meaning, romanization: romanization || null, emoji: clean(w.emoji, 16) || "⭐" });
    if (words.length === 6) break;
  }

  const seenSentences = new Set<string>();
  const sentences: LessonSentence[] = [];
  for (const s of raw.sentences) {
    const text = clean(s.text, MAX_SENTENCE);
    const meaning = clean(s.meaning, MAX_SENTENCE);
    const tokens = s.tokens
      .map((t) => ({ text: clean(t.text, MAX_WORD), romanization: t.romanization ? clean(t.romanization, MAX_WORD) || null : null }))
      .filter((t) => t.text);
    // The tiles must spell the sentence, or the learner could never build it.
    if (!text || !meaning || tokens.length < 2 || tokens.length > 8) continue;
    if (letters(tokens.map((t) => t.text).join("")) !== letters(text)) continue;
    if (seenSentences.has(text.toLocaleLowerCase())) continue;
    seenSentences.add(text.toLocaleLowerCase());
    sentences.push({ text, tokens, meaning });
    if (sentences.length === 4) break;
  }

  if (words.length < 4 || sentences.length < 2) return null;
  return { title: clean(raw.title, 60) || words[0].meaning, words, sentences };
}

/** Shows a word with its reading, like "नमस्ते (namaste)". */
export function withReading(word: string, romanization?: string | null): string {
  return romanization && romanization.toLocaleLowerCase() !== word.toLocaleLowerCase() ? `${word} (${romanization})` : word;
}

/** The reading of a whole sentence, or null when any token lacks one. */
export function sentenceReading(tokens: Token[]): string | null {
  if (tokens.length === 0 || tokens.some((t) => !t.romanization)) return null;
  return tokens.map((t) => t.romanization).join(" ");
}

/** Tokens joined the way `like` is written: with spaces, or without for scripts that have none. */
export function joinTokens(tokens: Token[], like: string): string {
  return tokens.map((t) => t.text).join(like.includes(" ") ? " " : "");
}

/** Latin-letter readings by word, for the words that have one. */
export type Romans = Record<string, string>;

export type CardStep = { type: "card"; word: string; romanization: string | null; meaning: string; emoji: string };
export type SentenceCardStep = { type: "sentenceCard"; sentence: LessonSentence };
export type MatchStep = { type: "match"; pairs: { word: string; meaning: string }[]; meanings: string[]; romans: Romans };
export type ChoiceStep = { type: "choice"; meaning: string; emoji: string; options: string[]; answer: string; romans: Romans };
export type ListenStep = { type: "listen"; word: string; romanization: string | null; options: { meaning: string; emoji: string }[]; answer: string };
export type SayStep = { type: "say"; word: string; romanization: string | null; meaning: string };
/** Tap the tiles in order to rebuild a sentence. `listen` hides the meaning and plays the sentence instead. */
export type BuildStep = { type: "build"; meaning: string; text: string; answer: Token[]; bank: Token[]; listen: boolean };
export type LessonStep = CardStep | SentenceCardStep | MatchStep | ChoiceStep | ListenStep | SayStep | BuildStep;

/** Cards only teach; every other step is scored. */
export function isScored(step: LessonStep): boolean {
  return step.type !== "card" && step.type !== "sentenceCard";
}

export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Picks `count` items from `pool` that are not `answer`, then adds `answer` and shuffles. */
function withDistractors<T>(answer: T, pool: T[], count: number, random: () => number): T[] {
  const others = shuffle(pool.filter((p) => p !== answer), random).slice(0, count);
  return shuffle([answer, ...others], random);
}

/** What a word needs to appear in a step. The emoji is optional for words learned earlier. */
export type Vocab = { word: string; romanization: string | null; meaning: string; emoji?: string };

const FALLBACK_EMOJI = "💬";

function romansOf(words: Vocab[]): Romans {
  return Object.fromEntries(words.filter((w) => w.romanization).map((w) => [w.word, w.romanization as string]));
}

export const cardStep = (w: Vocab): CardStep => ({ type: "card", word: w.word, romanization: w.romanization, meaning: w.meaning, emoji: w.emoji ?? FALLBACK_EMOJI });

export function matchStep(words: Vocab[], random: () => number = Math.random): MatchStep {
  return {
    type: "match",
    pairs: words.map(({ word, meaning }) => ({ word, meaning })),
    meanings: shuffle(words.map((w) => w.meaning), random),
    romans: romansOf(words),
  };
}

export function choiceStep(word: Vocab, pool: Vocab[], random: () => number = Math.random): ChoiceStep {
  return {
    type: "choice",
    meaning: word.meaning,
    emoji: word.emoji ?? FALLBACK_EMOJI,
    options: withDistractors(word, pool, 2, random).map((w) => w.word),
    answer: word.word,
    romans: romansOf(pool.concat(word)),
  };
}

export function listenStep(word: Vocab, pool: Vocab[], random: () => number = Math.random): ListenStep {
  return {
    type: "listen",
    word: word.word,
    romanization: word.romanization,
    options: withDistractors(word, pool, 2, random).map(({ meaning, emoji }) => ({ meaning, emoji: emoji ?? FALLBACK_EMOJI })),
    answer: word.meaning,
  };
}

export const sayStep = (w: Vocab): SayStep => ({ type: "say", word: w.word, romanization: w.romanization, meaning: w.meaning });

/** A sentence with one wrong tile mixed in from another sentence, when there is a spare one. */
export function buildStep(sentence: LessonSentence, pool: LessonSentence[], listen: boolean, random: () => number = Math.random): BuildStep {
  const own = new Set(sentence.tokens.map((t) => t.text));
  const spare = shuffle(
    pool.filter((s) => s.text !== sentence.text).flatMap((s) => s.tokens).filter((t) => !own.has(t.text)),
    random,
  ).slice(0, 1);
  let bank = shuffle([...sentence.tokens, ...spare], random);
  // A bank that is already in order would give the answer away.
  for (let i = 0; i < 10 && sentence.tokens.every((t, n) => bank[n]?.text === t.text); i++) bank = shuffle(bank, random);
  return { type: "build", meaning: sentence.meaning, text: sentence.text, answer: sentence.tokens, bank, listen };
}

/** Part 1: meet each word on a card, then a six-question quiz on them. */
export function buildWordsLesson(content: LessonContent, random: () => number = Math.random): LessonStep[] {
  const w = content.words;
  return [
    ...w.map(cardStep),
    matchStep(w.slice(0, 4), random),
    choiceStep(w[4] ?? w[1], w, random),
    listenStep(w[5] ?? w[2], w, random),
    choiceStep(w[2], w, random),
    listenStep(w[3], w, random),
    sayStep(w[0]),
  ];
}

/** Part 2: meet each sentence on a card, then rebuild every one from tiles; the last by ear. */
export function buildSentencesLesson(content: LessonContent, random: () => number = Math.random): LessonStep[] {
  const s = content.sentences;
  return [
    ...s.map((sentence): LessonStep => ({ type: "sentenceCard", sentence })),
    ...s.map((sentence, i) => buildStep(sentence, s, i === s.length - 1, random)),
  ];
}

/** Part 3: a mixed test of the unit's words, then its sentences. */
export function buildUnitTest(content: LessonContent, random: () => number = Math.random): LessonStep[] {
  const w = shuffle(content.words, random);
  const s = shuffle(content.sentences, random).slice(0, 3);
  return [
    matchStep(w.slice(0, 4), random),
    choiceStep(w[0], content.words, random),
    choiceStep(w[1], content.words, random),
    listenStep(w[2], content.words, random),
    listenStep(w[3], content.words, random),
    ...s.map((sentence, i) => buildStep(sentence, content.sentences, i === s.length - 1, random)),
  ];
}
