import { describe, expect, it } from "vitest";
import { currentStreak, isPartUnlocked, isUnlocked, nextStep, nextUnit, pointsFor, starsFor, todaysPick, totalStars, weekActivity } from "@/lib/progress";
import { UNITS } from "@/lib/units";

const day = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12);

describe("stars and points", () => {
  it("matches the thresholds in complete_lesson", () => {
    expect(starsFor(5, 5)).toBe(3);
    expect(starsFor(4, 5)).toBe(2);
    expect(starsFor(3, 5)).toBe(2);
    expect(starsFor(2, 5)).toBe(1);
    expect(starsFor(0, 5)).toBe(0);
    expect(starsFor(0, 0)).toBe(0);
  });

  it("adds a bonus for a perfect lesson", () => {
    expect(pointsFor(5, 5)).toBe(35);
    expect(pointsFor(4, 5)).toBe(20);
  });
});

describe("unlocking", () => {
  it("opens the first unit, then each unit after one with its words and sentences done", () => {
    expect(isUnlocked(0, {}, 1)).toBe(true);
    expect(isUnlocked(1, {}, 1)).toBe(false);
    expect(isUnlocked(1, { hello: { words: 3 } }, 1)).toBe(false);
    expect(isUnlocked(1, { hello: { words: 1, sentences: 1 } }, 1)).toBe(true);
    expect(isUnlocked(2, { hello: { words: 3, sentences: 3 } }, 1)).toBe(false);
  });

  it("opens the parts of a unit in order", () => {
    expect(isPartUnlocked("words", undefined)).toBe(true);
    expect(isPartUnlocked("sentences", undefined)).toBe(false);
    expect(isPartUnlocked("sentences", { words: 1 })).toBe(true);
    expect(isPartUnlocked("test", { words: 3 })).toBe(false);
    expect(isPartUnlocked("test", { words: 1, sentences: 1 })).toBe(true);
  });

  it("opens more units for a higher placement level", () => {
    expect(isUnlocked(8, {}, 2)).toBe(true);
    expect(isUnlocked(9, {}, 2)).toBe(false);
    expect(isUnlocked(16, {}, 3)).toBe(true);
    expect(isUnlocked(17, {}, 3)).toBe(false);
  });

  it("picks the next words, sentences or test to do", () => {
    expect(todaysPick({}, 1)).toEqual({ unit: "hello", part: "words" });
    expect(todaysPick({ hello: { words: 2 } }, 1)).toEqual({ unit: "hello", part: "sentences" });
    expect(todaysPick({ hello: { words: 2, sentences: 1 } }, 1)).toEqual({ unit: "colors", part: "words" });
  });

  it("goes back to unfinished tests once every open unit has words and sentences", () => {
    const done = { words: 3, sentences: 3 };
    const progress = Object.fromEntries(UNITS.map((u) => [u.id, done]));
    expect(todaysPick(progress, 1)).toEqual({ unit: "hello", part: "test" });
    expect(todaysPick({ ...progress, hello: { ...done, test: 3 } }, 1)).toEqual({ unit: "colors", part: "test" });
  });

  it("moves from words to sentences to the test to the next unit", () => {
    expect(nextStep("hello", "words")).toEqual({ unit: "hello", part: "sentences" });
    expect(nextStep("hello", "sentences")).toEqual({ unit: "hello", part: "test" });
    expect(nextStep("hello", "test")).toEqual({ unit: "colors", part: "words" });
    expect(nextStep("travel", "test")).toBeUndefined();
  });

  it("finds the next unit and totals stars", () => {
    expect(nextUnit("hello")).toBe("colors");
    expect(nextUnit("numbers")).toBe("body");
    expect(nextUnit("travel")).toBeUndefined();
    expect(totalStars({ hello: { words: 3, sentences: 2 }, colors: { words: 1 } })).toBe(6);
  });
});

describe("streaks", () => {
  const today = day(2026, 10, 21); // a Wednesday

  it("counts consecutive days ending today", () => {
    expect(currentStreak([day(2026, 10, 21), day(2026, 10, 20), day(2026, 10, 19)], today)).toBe(3);
  });

  it("keeps yesterday's streak alive until today ends", () => {
    expect(currentStreak([day(2026, 10, 20), day(2026, 10, 19)], today)).toBe(2);
  });

  it("breaks on a missed day", () => {
    expect(currentStreak([day(2026, 10, 21), day(2026, 10, 19)], today)).toBe(1);
    expect(currentStreak([day(2026, 10, 18)], today)).toBe(0);
  });

  it("counts several lessons on one day once", () => {
    expect(currentStreak([day(2026, 10, 21), new Date(2026, 9, 21, 8)], today)).toBe(1);
  });

  it("marks this week's active days from Monday", () => {
    expect(weekActivity([day(2026, 10, 19), day(2026, 10, 21), day(2026, 10, 12)], today)).toEqual([
      true, false, true, false, false, false, false,
    ]);
  });
});
