import { describe, expect, it } from "vitest";
import { CONCEPTS, buildQuestion, estimateLevel, nextDifficulty } from "@/lib/placement";
import { NATIVE_LANGS, TARGET_LANGS } from "@/lib/languages";

function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

describe("placement bank", () => {
  it("has a gloss and a term for every language", () => {
    for (const concept of CONCEPTS) {
      for (const lang of NATIVE_LANGS) expect(concept.gloss[lang], `${concept.id}/${lang}`).toBeTruthy();
      for (const lang of TARGET_LANGS) expect(concept.terms[lang].text, `${concept.id}/${lang}`).toBeTruthy();
    }
  });

  it("has enough concepts at each difficulty for three options", () => {
    for (const level of [1, 2, 3]) expect(CONCEPTS.filter((c) => c.difficulty === level).length).toBeGreaterThanOrEqual(3);
  });
});

describe("buildQuestion", () => {
  it("builds three distinct options with the answer among them", () => {
    for (let s = 1; s < 50; s++) {
      const q = buildQuestion("es", "en", 1, [], seeded(s));
      expect(q.options).toHaveLength(3);
      expect(new Set(q.options.map((o) => o.text)).size).toBe(3);
      const concept = CONCEPTS.find((c) => c.id === q.conceptId)!;
      expect(q.options[q.answerIndex].text).toBe(concept.terms.es.text);
      expect(q.prompt).toBe(concept.gloss.en);
    }
  });

  it("does not repeat a used concept while others remain", () => {
    const used = CONCEPTS.filter((c) => c.difficulty === 2 && c.id !== "sun").map((c) => c.id);
    expect(buildQuestion("fr", "hi", 2, used, seeded(7)).conceptId).toBe("sun");
  });
});

describe("adaptive level", () => {
  it("moves difficulty up and down within 1–3", () => {
    expect(nextDifficulty(1, true)).toBe(2);
    expect(nextDifficulty(3, true)).toBe(3);
    expect(nextDifficulty(1, false)).toBe(1);
    expect(nextDifficulty(3, false)).toBe(2);
  });

  it("estimates the level from the answers", () => {
    expect(estimateLevel([])).toBe(1);
    expect(estimateLevel([{ difficulty: 1, correct: false }])).toBe(1);
    expect(
      estimateLevel([
        { difficulty: 1, correct: true },
        { difficulty: 2, correct: true },
        { difficulty: 3, correct: true },
        { difficulty: 3, correct: true },
        { difficulty: 3, correct: false },
      ]),
    ).toBe(3);
    expect(
      estimateLevel([
        { difficulty: 1, correct: true },
        { difficulty: 2, correct: false },
        { difficulty: 1, correct: false },
        { difficulty: 1, correct: false },
        { difficulty: 1, correct: false },
      ]),
    ).toBe(1);
  });
});
