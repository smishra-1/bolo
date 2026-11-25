import { PARTS, UNITS, tierStart, type Part, type UnitId } from "./units";

// Keep in sync with public.complete_lesson in supabase/schema.sql.
export function starsFor(correct: number, total: number): number {
  if (total <= 0) return 0;
  const ratio = correct / total;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.6) return 2;
  if (correct > 0) return 1;
  return 0;
}

export function pointsFor(correct: number, total: number): number {
  return correct * 5 + (starsFor(correct, total) === 3 ? 10 : 0);
}

/** Stars earned in each part of each unit. */
export type PartStars = Partial<Record<Part, number>>;
export type ProgressByUnit = Partial<Record<UnitId, PartStars>>;

const has = (progress: PartStars | undefined, part: Part) => (progress?.[part] ?? 0) > 0;

/** A unit is finished once its words and its sentences each have a star; the test is a bonus. */
export function unitFinished(progress: PartStars | undefined): boolean {
  return has(progress, "words") && has(progress, "sentences");
}

/** Words are always open, sentences open after the words, and the test after the sentences. */
export function isPartUnlocked(part: Part, progress: PartStars | undefined): boolean {
  if (part === "words") return true;
  return part === "sentences" ? has(progress, "words") : has(progress, "sentences");
}

/**
 * A unit is open when the one before it is finished. A higher placement level
 * opens every unit up to the start of its tier, so a learner who already knows
 * the basics can begin further along.
 */
export function isUnlocked(index: number, progress: ProgressByUnit, level: number): boolean {
  if (index <= tierStart(Math.max(1, level))) return true;
  const previous = UNITS[index - 1];
  return previous !== undefined && unitFinished(progress[previous.id]);
}

export type Step = { unit: UnitId; part: Part };

/**
 * What to do next: the first open unit with words or sentences left, else the
 * first test not yet at three stars, else the first unit again.
 */
export function todaysPick(progress: ProgressByUnit, level: number): Step {
  const open = UNITS.filter((_, index) => isUnlocked(index, progress, level));
  for (const unit of open) {
    if (!has(progress[unit.id], "words")) return { unit: unit.id, part: "words" };
    if (!has(progress[unit.id], "sentences")) return { unit: unit.id, part: "sentences" };
  }
  const test = open.find((unit) => (progress[unit.id]?.test ?? 0) < 3);
  return { unit: (test ?? open[0] ?? UNITS[0]).id, part: test ? "test" : "words" };
}

/** The step after finishing `part` of `unit`: words, then sentences, then the test, then the next unit. */
export function nextStep(unit: UnitId, part: Part): Step | undefined {
  const index = PARTS.indexOf(part);
  if (index < PARTS.length - 1) return { unit, part: PARTS[index + 1] };
  const following = nextUnit(unit);
  return following ? { unit: following, part: "words" } : undefined;
}

/** The unit after `id`, if there is one. */
export function nextUnit(id: UnitId): UnitId | undefined {
  const index = UNITS.findIndex((unit) => unit.id === id);
  return UNITS[index + 1]?.id;
}

/** All stars earned, for the profile. */
export function totalStars(progress: ProgressByUnit): number {
  return Object.values(progress).reduce((sum, parts) => sum + Object.values(parts ?? {}).reduce((s, n) => s + (n ?? 0), 0), 0);
}

/** Local calendar day as YYYY-MM-DD. */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/**
 * Days in a row with at least one lesson, counting back from today. A streak
 * survives until the end of today even if today has no lesson yet.
 */
export function currentStreak(activity: Date[], today = new Date()): number {
  const days = new Set(activity.map(dayKey));
  let cursor = days.has(dayKey(today)) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Monday-to-Sunday flags for the current week: true when a lesson was done. */
export function weekActivity(activity: Date[], today = new Date()): boolean[] {
  const days = new Set(activity.map(dayKey));
  const offset = (today.getDay() + 6) % 7; // Monday = 0
  const monday = addDays(today, -offset);
  return Array.from({ length: 7 }, (_, i) => days.has(dayKey(addDays(monday, i))));
}
