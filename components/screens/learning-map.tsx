"use client";

import Link from "next/link";
import { useProgress } from "@/hooks/use-progress";
import { fmt } from "@/lib/i18n";
import { LANGS } from "@/lib/languages";
import { isUnlocked, todaysPick } from "@/lib/progress";
import { UNITS, getUnit } from "@/lib/units";
import { useApp } from "../app-provider";
import { BottomNav, SignOutButton, TopBar } from "../app-shell";
import { ButtonLink, Card, Stars } from "../ui";

// Horizontal offsets that make the path wind left and right.
const WIND = ["translate-x-0", "translate-x-16", "translate-x-24", "translate-x-10", "-translate-x-10", "-translate-x-20"];

export function LearningMap() {
  const { target, course, m } = useApp();
  const { stars, streak, week } = useProgress();
  if (!target) return null;

  const level = course?.level ?? 1;
  const pickId = todaysPick(stars, level);
  const pick = getUnit(pickId)!;

  return (
    <>
      <TopBar streak={streak} />
      <main className="mx-auto grid max-w-5xl gap-6 px-4 pt-6 pb-28 md:grid-cols-[1fr_300px]">
        <section aria-labelledby="map-title">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
            <h1 id="map-title" className="font-display text-3xl font-bold">
              {m.languages[target]} <span className="text-lg text-muted">{LANGS[target].badge}</span> · {m.map.title}
            </h1>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm font-semibold text-brand underline-offset-4 hover:underline">
                {m.map.changeLanguage}
              </Link>
              <SignOutButton />
            </div>
          </div>

          <ol className="flex flex-col items-center gap-6">
            {UNITS.map((unit, index) => {
              const open = isUnlocked(index, stars, level);
              const count = stars[unit.id] ?? 0;
              const isPick = unit.id === pickId;
              const name = m.units[unit.id];
              const node = (
                <>
                  {isPick && (
                    <span className="absolute -top-7 rounded-full border-2 border-ink bg-sun px-2 text-xs font-bold whitespace-nowrap">
                      ✨ {m.map.todaysPick}
                    </span>
                  )}
                  <span
                    className={`grid size-20 place-items-center rounded-full border-2 text-4xl ${
                      open ? `border-ink shadow-chunky ${count > 0 ? "bg-yay-soft" : isPick ? "bg-sky-100" : "bg-white"}` : "border-dashed border-muted bg-white/60 grayscale"
                    }`}
                  >
                    <span aria-hidden>{open ? unit.emoji : "🔒"}</span>
                  </span>
                  <span className={`font-display text-lg font-semibold ${open ? "" : "text-muted"}`}>{name}</span>
                  {open && <Stars count={count} label={fmt(m.map.stars, { n: count })} size="text-sm" />}
                </>
              );
              return (
                <li key={unit.id} className={`transition-transform ${WIND[index % WIND.length]}`}>
                  {open ? (
                    <Link href={`/lesson/${unit.id}`} className="press relative flex flex-col items-center gap-1 rounded-3xl p-1">
                      {node}
                    </Link>
                  ) : (
                    <div className="relative flex flex-col items-center gap-1 p-1" aria-label={`${name}: ${m.map.locked}`}>
                      {node}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        <aside className="flex flex-col gap-4 md:sticky md:top-20 md:self-start">
          <Card className="bg-sun-soft p-5 text-center">
            <p className="font-display text-lg font-bold">✨ {m.map.todaysPick}</p>
            <p className="text-xs text-muted">{m.map.pickedForYou}</p>
            <p className="my-2 text-5xl" aria-hidden>{pick.emoji}</p>
            <p className="font-display text-2xl font-semibold">{m.units[pick.id]}</p>
            <p className="mb-3 text-sm text-muted">
              {fmt(m.map.minutes, { n: 5 })} · {fmt(m.map.wordsCount, { n: pick.seeds.length })}
            </p>
            <ButtonLink href={`/lesson/${pick.id}`} className="w-full">
              {m.map.start} →
            </ButtonLink>
          </Card>

          <Card className="p-5 text-center">
            <p className="text-4xl" aria-hidden>🔥</p>
            <p className="font-display text-xl font-semibold">{fmt(m.map.streak, { n: streak })}</p>
            <ol className="mt-3 flex justify-between">
              {m.map.weekdays.map((day, i) => (
                <li key={i} className="flex flex-col items-center gap-1 text-xs text-muted">
                  <span className={`size-7 rounded-full border-2 ${week[i] ? "border-ink bg-oops" : "border-dashed border-muted"}`} />
                  {day}
                </li>
              ))}
            </ol>
          </Card>
        </aside>
      </main>
      <BottomNav />
    </>
  );
}
