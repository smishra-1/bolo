import { describe, expect, it } from "vitest";
import { MIN_WORDS_FOR_TEST, buildSentencePractice, buildWordPractice, parseLearnedSentence, type LearnedSentence, type LearnedWord } from "@/lib/practice";

const word = (w: string, meaning: string): LearnedWord => ({ word: w, meaning, romanization: null });
const words = [word("gato", "cat"), word("perro", "dog"), word("agua", "water"), word("casa", "house"), word("libro", "book"), word("sol", "sun")];
const tok = (text: string) => ({ text, romanization: null });
const sentences: LearnedSentence[] = [
  { text: "El gato bebe agua", tokens: ["El", "gato", "bebe", "agua"].map(tok), meaning: "The cat drinks water" },
  { text: "Mi casa es grande", tokens: ["Mi", "casa", "es", "grande"].map(tok), meaning: "My house is big" },
];

describe("practice", () => {
  it("needs a few words before it can test them", () => {
    expect(buildWordPractice(words.slice(0, MIN_WORDS_FOR_TEST - 1))).toEqual([]);
    expect(buildWordPractice(words.slice(0, MIN_WORDS_FOR_TEST)).length).toBeGreaterThan(0);
  });

  it("builds a varied word test with the right answer in every question", () => {
    const steps = buildWordPractice(words, 6);
    expect(steps).toHaveLength(6);
    expect(steps[0].type).toBe("match");
    for (const step of steps) {
      if (step.type === "choice") expect(step.options).toContain(step.answer);
      if (step.type === "listen") expect(step.options.map((o) => o.meaning)).toContain(step.answer);
    }
  });

  it("rebuilds learned sentences, the last by ear", () => {
    const steps = buildSentencePractice(sentences);
    expect(steps).toHaveLength(2);
    expect(steps.every((s) => s.type === "build")).toBe(true);
    expect(steps[steps.length - 1].type === "build" && steps[steps.length - 1]).toMatchObject({ listen: true });
  });

  it("reads saved sentences and skips broken rows", () => {
    expect(parseLearnedSentence({ sentence: "Hola amigo", meaning: "Hello friend", tokens: [tok("Hola"), tok("amigo")] })?.text).toBe("Hola amigo");
    expect(parseLearnedSentence({ sentence: "Hola", meaning: "Hello", tokens: [tok("Hola")] })).toBeNull();
    expect(parseLearnedSentence({ sentence: "x y", meaning: "z", tokens: "nope" })).toBeNull();
  });
});
