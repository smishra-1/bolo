import { describe, expect, it } from "vitest";
import {
  buildSentencesLesson,
  buildUnitTest,
  buildWordsLesson,
  isScored,
  joinTokens,
  normalizeLessonContent,
  sentenceReading,
  withReading,
  type LessonContent,
} from "@/lib/lesson";

const tok = (text: string, romanization: string | null = null) => ({ text, romanization });

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
    { text: "El cielo es azul.", tokens: [tok("El"), tok("cielo"), tok("es"), tok("azul")], meaning: "The sky is blue" },
    { text: "La rosa es roja.", tokens: [tok("La"), tok("rosa"), tok("es"), tok("roja")], meaning: "The rose is red" },
    { text: "Me gusta el verde", tokens: [tok("Me"), tok("gusta"), tok("el"), tok("verde")], meaning: "I like green" },
    { text: "Tengo un gato negro", tokens: [tok("Tengo"), tok("un"), tok("gato"), tok("negro")], meaning: "I have a black cat" },
  ],
};

describe("normalizeLessonContent", () => {
  it("trims, removes duplicates and keeps six words", () => {
    const content = normalizeLessonContent(raw)!;
    expect(content.title).toBe("Colours");
    expect(content.words.map((w) => w.word)).toEqual(["rojo", "azul", "verde", "amarillo", "negro", "blanco"]);
    expect(content.words[1].romanization).toBeNull();
  });

  it("keeps sentences whose tokens spell the text, ignoring spaces and punctuation", () => {
    expect(normalizeLessonContent(raw)!.sentences).toHaveLength(4);
  });

  it("drops sentences whose tokens do not spell the text, or that are too short", () => {
    const bad = [
      { text: "El cielo es azul", tokens: [tok("El"), tok("mar"), tok("es"), tok("azul")], meaning: "wrong tokens" },
      { text: "Hola", tokens: [tok("Hola")], meaning: "one tile" },
      raw.sentences[0],
      raw.sentences[1],
    ];
    expect(normalizeLessonContent({ ...raw, sentences: bad })!.sentences.map((s) => s.text)).toEqual(["El cielo es azul.", "La rosa es roja."]);
  });

  it("rejects content too thin for a lesson", () => {
    expect(normalizeLessonContent({ ...raw, words: raw.words.slice(0, 3) })).toBeNull();
    expect(normalizeLessonContent({ ...raw, sentences: raw.sentences.slice(0, 1) })).toBeNull();
  });
});

describe("lessons", () => {
  const content = normalizeLessonContent(raw)!;
  const types = (steps: ReturnType<typeof buildWordsLesson>) => steps.map((s) => s.type);

  it("part 1 shows every word on a card, then a six-question quiz", () => {
    const steps = buildWordsLesson(content);
    expect(types(steps)).toEqual([...Array(6).fill("card"), "match", "choice", "listen", "choice", "listen", "say"]);
    expect(steps.filter(isScored)).toHaveLength(6);
  });

  it("part 2 shows every sentence, then rebuilds each one, the last by ear", () => {
    const steps = buildSentencesLesson(content);
    expect(types(steps)).toEqual([...Array(4).fill("sentenceCard"), ...Array(4).fill("build")]);
    const builds = steps.filter((s) => s.type === "build");
    expect(builds.map((s) => s.listen)).toEqual([false, false, false, true]);
  });

  it("part 3 tests words, then sentences", () => {
    const steps = buildUnitTest(content);
    expect(types(steps)).toEqual(["match", "choice", "choice", "listen", "listen", "build", "build", "build"]);
    expect(steps.every(isScored)).toBe(true);
  });

  it("always includes the answer among distinct word options", () => {
    for (let i = 0; i < 25; i++) {
      for (const step of buildWordsLesson(content)) {
        if (step.type === "choice") {
          expect(step.options).toContain(step.answer);
          expect(new Set(step.options).size).toBe(step.options.length);
        }
        if (step.type === "listen") expect(step.options.map((o) => o.meaning)).toContain(step.answer);
      }
    }
  });

  it("gives a build step every tile of the sentence, plus at most one spare, never in order", () => {
    for (let i = 0; i < 25; i++) {
      for (const step of buildSentencesLesson(content)) {
        if (step.type !== "build") continue;
        const bank = step.bank.map((t) => t.text);
        for (const t of step.answer) expect(bank).toContain(t.text);
        expect(bank.length - step.answer.length).toBeLessThanOrEqual(1);
        expect(bank.slice(0, step.answer.length)).not.toEqual(step.answer.map((t) => t.text));
      }
    }
  });
});

describe("readings", () => {
  const tamil: LessonContent = {
    title: "Hello",
    words: [
      { word: "வணக்கம்", romanization: "vanakkam", meaning: "hello", emoji: "👋" },
      { word: "நன்றி", romanization: "nandri", meaning: "thank you", emoji: "🙏" },
      { word: "தயவு செய்து", romanization: "thayavu seithu", meaning: "please", emoji: "🙂" },
      { word: "பிரியாவிடை", romanization: "piriyaavidai", meaning: "goodbye", emoji: "👋" },
    ],
    sentences: [],
  };

  it("shows a word with its reading, but not when they match", () => {
    expect(withReading("நன்றி", "nandri")).toBe("நன்றி (nandri)");
    expect(withReading("gato", "gato")).toBe("gato");
    expect(withReading("gato", null)).toBe("gato");
  });

  it("gives steps the reading of every word", () => {
    const [match, choice] = buildWordsLesson(tamil).filter((s) => s.type === "match" || s.type === "choice");
    expect(match.type === "match" && match.romans["நன்றி"]).toBe("nandri");
    expect(choice.type === "choice" && choice.romans["வணக்கம்"]).toBe("vanakkam");
  });

  it("reads a whole sentence only when every token has a reading", () => {
    expect(sentenceReading([tok("நான்", "naan"), tok("நீ", "nee")])).toBe("naan nee");
    expect(sentenceReading([tok("நான்", "naan"), tok("நீ")])).toBeNull();
    expect(sentenceReading([])).toBeNull();
  });

  it("joins tokens with spaces, or without for scripts that have none", () => {
    expect(joinTokens([tok("El"), tok("gato")], "El gato")).toBe("El gato");
    expect(joinTokens([tok("私は"), tok("猫")], "私は猫です")).toBe("私は猫");
  });
});
