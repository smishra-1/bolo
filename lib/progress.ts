import { UNITS, tierStart, type UnitId } from "./units";

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

export type StarsByUnit = Partial<Record<UnitId, number>>;

/**
 * A unit is open when the one before it has at least one star. A higher
 * placement level opens every unit up to the start of its tier, so a learner
 * who already knows the basics can begin further along.
 */
export function isUnlocked(index: number, stars: StarsByUnit, level: number): boolean {
  if (index <= tierStart(Math.max(1, level))) return true;
  const previous = UNITS[index - 1];
  return previous !== undefined && (stars[previous.id] ?? 0) > 0;
}

/** The open unit with the fewest stars; ties go to the earliest one. */
export function todaysPick(stars: StarsByUnit, level: number): UnitId {
  let bestId: UnitId = UNITS[0].id;
  let bestStars = Infinity;
  for (const [index, unit] of UNITS.entries()) {
    if (!isUnlocked(index, stars, level)) continue;
    const count = stars[unit.id] ?? 0;
    if (count < 3 && count < bestStars) {
      bestId = unit.id;
      bestStars = count;
    }
  }
  return bestId;
}

/** The unit after `id`, if there is one. */
export function nextUnit(id: UnitId): UnitId | undefined {
  const index = UNITS.findIndex((unit) => unit.id === id);
  return UNITS[index + 1]?.id;
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
