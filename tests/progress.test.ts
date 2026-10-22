import { describe, expect, it } from "vitest";
import { currentStreak, isUnlocked, nextUnit, pointsFor, starsFor, todaysPick, weekActivity } from "@/lib/progress";

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
  it("opens the first unit, then each unit after a starred one", () => {
    expect(isUnlocked(0, {}, 1)).toBe(true);
    expect(isUnlocked(1, {}, 1)).toBe(false);
    expect(isUnlocked(1, { hello: 1 }, 1)).toBe(true);
    expect(isUnlocked(2, { hello: 3 }, 1)).toBe(false);
  });

  it("opens more units for a higher placement level", () => {
    expect(isUnlocked(8, {}, 2)).toBe(true);
    expect(isUnlocked(9, {}, 2)).toBe(false);
    expect(isUnlocked(16, {}, 3)).toBe(true);
    expect(isUnlocked(17, {}, 3)).toBe(false);
  });

  it("picks the open unit with the fewest stars", () => {
    expect(todaysPick({}, 1)).toBe("hello");
    expect(todaysPick({ hello: 3 }, 1)).toBe("colors");
    expect(todaysPick({ hello: 2, colors: 1 }, 1)).toBe("animals");
    expect(todaysPick({ hello: 3, colors: 3 }, 1)).toBe("animals");
  });

  it("finds the next unit", () => {
    expect(nextUnit("hello")).toBe("colors");
    expect(nextUnit("numbers")).toBe("body");
    expect(nextUnit("travel")).toBeUndefined();
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
