import { describe, expect, it } from "vitest";
import { comparePronunciation } from "@/lib/pronunciation";

describe("comparePronunciation", () => {
  it("accepts a perfect match regardless of case and punctuation", () => {
    const r = comparePronunciation("Hola", "¡hola!");
    expect(r.score).toBe(1);
    expect(r.firstMiss).toBeNull();
    expect(r.letters.map((l) => l.char).join("")).toBe("Hola");
  });

  it("marks the missed letter", () => {
    const r = comparePronunciation("Hola", "hol");
    expect(r.letters.map((l) => l.ok)).toEqual([true, true, true, false]);
    expect(r.firstMiss).toBe("a");
    expect(r.score).toBe(0.75);
  });

  it("ignores accents", () => {
    expect(comparePronunciation("mañana", "manana").score).toBe(1);
  });

  it("scores nothing heard as zero", () => {
    const r = comparePronunciation("gato", "");
    expect(r.score).toBe(0);
    expect(r.firstMiss).toBe("g");
  });

  it("keeps Devanagari letters with their vowel signs", () => {
    const r = comparePronunciation("बिल्ली", "बिल्ली");
    expect(r.score).toBe(1);
    expect(r.letters.length).toBeLessThan(Array.from("बिल्ली").length);
  });

  it("works for Japanese kana", () => {
    expect(comparePronunciation("ねこ", "ねこ。").score).toBe(1);
    expect(comparePronunciation("ねこ", "ね").firstMiss).toBe("こ");
  });

  it("skips spaces in phrases", () => {
    expect(comparePronunciation("buenas noches", "Buenas noches.").score).toBe(1);
  });
});
