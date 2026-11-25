import { z } from "zod";
import { buildStep, choiceStep, listenStep, matchStep, shuffle, type LessonSentence, type LessonStep, type Token, type Vocab } from "./lesson";

/** Words a learner has met, as saved by complete_lesson. */
export type LearnedWord = { word: string; meaning: string; romanization: string | null };
/** Sentences a learner has built, as saved by complete_lesson. */
export type LearnedSentence = LessonSentence;

/** A word test needs this many words so every question has wrong answers to pick from. */
export const MIN_WORDS_FOR_TEST = 4;

const tokensSchema = z.array(z.object({ text: z.string(), romanization: z.string().nullable() }));

/** Reads a sentence row, dropping it if its tokens are not usable. */
export function parseLearnedSentence(row: { sentence: string; meaning: string; tokens: unknown }): LearnedSentence | null {
  const tokens = tokensSchema.safeParse(row.tokens);
  if (!tokens.success || tokens.data.length < 2) return null;
  return { text: row.sentence, meaning: row.meaning, tokens: tokens.data as Token[] };
}

/** A varied test over words the learner has already met. */
export function buildWordPractice(words: LearnedWord[], count = 6, random: () => number = Math.random): LessonStep[] {
  const pool: Vocab[] = words;
  if (pool.length < MIN_WORDS_FOR_TEST) return [];
  const picks = shuffle(pool, random).slice(0, count);
  const steps: LessonStep[] = [matchStep(picks.slice(0, 4), random)];
  for (const [i, word] of picks.slice(4).entries()) steps.push(i % 2 === 0 ? choiceStep(word, pool, random) : listenStep(word, pool, random));
  // Top up so short tests still have a few questions.
  for (const [i, word] of picks.slice(0, 4).entries()) steps.push(i % 2 === 0 ? listenStep(word, pool, random) : choiceStep(word, pool, random));
  return steps.slice(0, count);
}

/** Rebuild sentences the learner has met; the last one by ear. */
export function buildSentencePractice(sentences: LearnedSentence[], count = 5, random: () => number = Math.random): LessonStep[] {
  const picks = shuffle(sentences, random).slice(0, count);
  return picks.map((sentence, i) => buildStep(sentence, sentences, i === picks.length - 1 && picks.length > 1, random));
}
