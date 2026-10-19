import { describe, expect, it } from "vitest";
import { buildLessonSteps, normalizeLessonContent, type LessonContent } from "@/lib/lesson";

const raw: LessonContent = {
  title: " Colours ",
  words: [
    { word: "rojo", romanization: null, meaning: "red", emoji: "🔴" },
    { word: "azul", romanization: "", meaning: "blue", emoji: "🔵" },
    { word: "verde", romanization: null, meaning: "green", emoji: "🟢" },
    { word: "Rojo", romanization: null, meaning: "red again", emoji: "🔴" },
    { word: "amarillo", romanization: null, meaning: "yellow", emoji: "🟡" },
    { word: "negro", romanization: null, meaning: "black", emoji: "⚫" },
    { word: "blanco", romanization: null, meaning: "white", emoji: "⚪" },
    { word: "gris", romanization: null, meaning: "grey", emoji: "🩶" },
  ],
  sentences: [
    { text: "El cielo es azul", blank: "azul", meaning: "The sky is blue" },
    { text: "La rosa es roja", blank: "rojo", meaning: "The rose is red" },
  ],
};

describe("normalizeLessonContent", () => {
  it("trims, removes duplicates and keeps six words", () => {
    const content = normalizeLessonContent(raw)!;
    expect(content.title).toBe("Colours");
    expect(content.words.map((w) => w.word)).toEqual(["rojo", "azul", "verde", "amarillo", "negro", "blanco"]);
    expect(content.words[1].romanization).toBeNull();
  });

  it("drops sentences whose blank is not in the text", () => {
    expect(normalizeLessonContent(raw)!.sentences).toHaveLength(1);
  });

  it("rejects content too thin for a lesson", () => {
    expect(normalizeLessonContent({ ...raw, words: raw.words.slice(0, 3) })).toBeNull();
    expect(normalizeLessonContent({ ...raw, sentences: [] })).toBeNull();
  });
});

describe("buildLessonSteps", () => {
  const content = normalizeLessonContent(raw)!;

  it("builds one step of each kind, in order", () => {
    expect(buildLessonSteps(content).map((s) => s.type)).toEqual(["match", "choice", "listen", "fill", "say"]);
  });

  it("always includes the answer among distinct options", () => {
    for (let i = 0; i < 25; i++) {
      for (const step of buildLessonSteps(content)) {
        if (step.type === "choice" || step.type === "fill") {
          expect(step.options).toContain(step.answer);
          expect(new Set(step.options).size).toBe(step.options.length);
        }
        if (step.type === "listen") expect(step.options.map((o) => o.meaning)).toContain(step.answer);
        if (step.type === "match") expect([...step.meanings].sort()).toEqual(step.pairs.map((p) => p.meaning).sort());
      }
    }
  });

  it("splits the sentence around the blank", () => {
    const fill = buildLessonSteps(content).find((s) => s.type === "fill")!;
    expect(fill).toMatchObject({ before: "El cielo es ", after: "", answer: "azul" });
  });
});
