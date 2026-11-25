import { z } from "zod";

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
        text: z.string().describe("Very short sentence in the target language that contains `blank`"),
        blank: z.string().describe("One of the vocabulary words, exactly as it appears in `text`"),
        meaning: z.string().describe("The sentence's meaning in the learner's native language"),
        romanization: z.string().nullable().describe("Latin-letter reading of the whole sentence for non-Latin scripts, else null"),
      }),
    )
    .describe("Exactly 2 example sentences"),
});

export type LessonContent = z.infer<typeof lessonContentSchema>;
export type LessonWord = LessonContent["words"][number];

const MAX_WORD = 80;
const MAX_MEANING = 120;
const MAX_SENTENCE = 160;

const clean = (s: string, max: number) => s.replace(/\s+/g, " ").trim().slice(0, max);

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

  const sentences = raw.sentences
    .map((s) => ({
      text: clean(s.text, MAX_SENTENCE),
      blank: clean(s.blank, MAX_WORD),
      meaning: clean(s.meaning, MAX_SENTENCE),
      romanization: s.romanization ? clean(s.romanization, MAX_SENTENCE) || null : null,
    }))
    .filter((s) => s.blank && s.meaning && s.text.includes(s.blank))
    .slice(0, 2);

  if (words.length < 4 || sentences.length < 1) return null;
  return { title: clean(raw.title, 60) || words[0].meaning, words, sentences };
}

/** Latin-letter readings by word, for the words that have one. */
export type Romans = Record<string, string>;

export type MatchStep = { type: "match"; pairs: { word: string; meaning: string }[]; meanings: string[]; romans: Romans };
export type ChoiceStep = { type: "choice"; meaning: string; emoji: string; options: string[]; answer: string; romans: Romans };
export type ListenStep = { type: "listen"; word: string; romanization: string | null; options: { meaning: string; emoji: string }[]; answer: string };
export type FillStep = {
  type: "fill";
  before: string;
  after: string;
  meaning: string;
  options: string[];
  answer: string;
  romans: Romans;
  /** Reading of the finished sentence. */
  romanization: string | null;
};
export type SayStep = { type: "say"; word: string; romanization: string | null; meaning: string };
export type LessonStep = MatchStep | ChoiceStep | ListenStep | FillStep | SayStep;

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Picks `count` items from `pool` that are not `except`, then adds `except` and shuffles. */
function withDistractors<T>(answer: T, pool: T[], count: number, random: () => number): T[] {
  const others = shuffle(pool.filter((p) => p !== answer), random).slice(0, count);
  return shuffle([answer, ...others], random);
}

/**
 * Reads lesson content saved before sentences had a reading: the missing field
 * becomes null instead of making the whole lesson unusable.
 */
export function parseCachedLesson(content: unknown): LessonContent | null {
  if (content && typeof content === "object" && Array.isArray((content as { sentences?: unknown }).sentences)) {
    const c = content as { sentences: Record<string, unknown>[] };
    content = { ...c, sentences: c.sentences.map((s) => ({ romanization: null, ...s })) };
  }
  const parsed = lessonContentSchema.safeParse(content);
  return parsed.success ? parsed.data : null;
}

/** Shows a word with its reading, like "नमस्ते (namaste)". */
export function withReading(word: string, romanization?: string | null): string {
  return romanization && romanization.toLocaleLowerCase() !== word.toLocaleLowerCase() ? `${word} (${romanization})` : word;
}

/**
 * Five steps, one of each kind: match the words, pick the word, listen and
 * pick, fill the blank, say it.
 */
export function buildLessonSteps(content: LessonContent, random: () => number = Math.random): LessonStep[] {
  const words = content.words;
  const matchWords = words.slice(0, 4);
  const choiceWord = words[4] ?? words[1];
  const listenWord = words[5] ?? words[2];
  const sayWord = words[0];
  const sentence = content.sentences[0];
  const romans: Romans = Object.fromEntries(words.filter((w) => w.romanization).map((w) => [w.word, w.romanization as string]));
  const [before, ...rest] = sentence.text.split(sentence.blank);

  return [
    {
      type: "match",
      pairs: matchWords.map(({ word, meaning }) => ({ word, meaning })),
      meanings: shuffle(matchWords.map((w) => w.meaning), random),
      romans,
    },
    {
      type: "choice",
      meaning: choiceWord.meaning,
      emoji: choiceWord.emoji,
      options: withDistractors(choiceWord, words, 2, random).map((w) => w.word),
      answer: choiceWord.word,
      romans,
    },
    {
      type: "listen",
      word: listenWord.word,
      romanization: listenWord.romanization,
      options: withDistractors(listenWord, words, 2, random).map(({ meaning, emoji }) => ({ meaning, emoji })),
      answer: listenWord.meaning,
    },
    {
      type: "fill",
      before,
      after: rest.join(sentence.blank),
      meaning: sentence.meaning,
      options: withDistractors(sentence.blank, words.map((w) => w.word).concat(sentence.blank), 2, random),
      answer: sentence.blank,
      romans,
      romanization: sentence.romanization,
    },
    { type: "say", word: sayWord.word, romanization: sayWord.romanization, meaning: sayWord.meaning },
  ];
}
