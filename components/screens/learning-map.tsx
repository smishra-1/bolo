"use client";

import Link from "next/link";
import { Fragment } from "react";
import { useProgress } from "@/hooks/use-progress";
import { fmt } from "@/lib/i18n";
import { LANGS } from "@/lib/languages";
import { isUnlocked, todaysPick } from "@/lib/progress";
import { UNITS, getUnit } from "@/lib/units";
import { useApp } from "../app-provider";
import { BottomNav, TopBar } from "../app-shell";
import { ButtonLink, Card, Stars } from "../ui";

// Horizontal offsets (px) that make the path wind left and right.
const WIND = [0, 64, 96, 40, -40, -80];
// Vertical space between islands, where the dotted trail runs.
const GAP = 56;

/** Each unit is its own little island; colours are handed out in turn. */
const ISLANDS = [
  { fill: "from-amber-200 to-amber-400", halo: "ring-amber-200/70", label: "bg-amber-100", trail: "#f59e0b" },
  { fill: "from-pink-200 to-fuchsia-400", halo: "ring-pink-200/70", label: "bg-pink-100", trail: "#ec4899" },
  { fill: "from-lime-200 to-green-400", halo: "ring-green-200/70", label: "bg-green-100", trail: "#22c55e" },
  { fill: "from-orange-200 to-red-400", halo: "ring-orange-200/70", label: "bg-orange-100", trail: "#f97316" },
  { fill: "from-violet-200 to-purple-400", halo: "ring-violet-200/70", label: "bg-violet-100", trail: "#8b5cf6" },
  { fill: "from-sky-200 to-blue-400", halo: "ring-sky-200/70", label: "bg-sky-100", trail: "#3b82f6" },
  { fill: "from-teal-200 to-emerald-400", halo: "ring-teal-200/70", label: "bg-teal-100", trail: "#14b8a6" },
  { fill: "from-rose-200 to-rose-400", halo: "ring-rose-200/70", label: "bg-rose-100", trail: "#f43f5e" },
] as const;

// A raised, 3D look: light on top, shade at the bottom, ink drop shadow below.
const ISLAND_SHADOW = "inset 0 6px 0 0 rgb(255 255 255 / 0.5), inset 0 -8px 0 0 rgb(0 0 0 / 0.14), 0 6px 0 0 var(--color-ink)";

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
            <Link href="/start" className="text-sm font-semibold text-brand underline-offset-4 hover:underline">
              {m.map.changeLanguage}
            </Link>
          </div>

          <ol className="flex flex-col items-center pt-10 pb-4" style={{ gap: GAP }}>
            {UNITS.map((unit, index) => {
              const open = isUnlocked(index, stars, level);
              const count = stars[unit.id] ?? 0;
              const isPick = unit.id === pickId;
              const name = m.units[unit.id];
              const look = ISLANDS[index % ISLANDS.length];
              const tierStarts = unit.tier !== UNITS[index - 1]?.tier;
              const offset = WIND[index % WIND.length];
              const fromX = index > 0 ? WIND[(index - 1) % WIND.length] - offset : 0;

              const node = (
                <>
                  {isPick && (
                    <span className="absolute -top-9 z-10 animate-float rounded-full border-2 border-ink bg-sun px-2.5 py-0.5 text-xs font-bold whitespace-nowrap shadow-chunky-sm">
                      ✨ {m.map.todaysPick}
                    </span>
                  )}
                  <span className="relative">
                    {isPick && <span aria-hidden className={`absolute inset-0 animate-halo rounded-full bg-linear-to-b ${look.fill}`} />}
                    <span
                      className={`relative grid size-24 place-items-center rounded-full border-[3px] text-5xl transition-[translate,box-shadow] duration-150 ${
                        open
                          ? `border-ink bg-linear-to-b ${look.fill} ring-8 ${look.halo} group-hover:-translate-y-0.5 group-active:translate-y-1.5`
                          : "border-dashed border-muted bg-white/70"
                      }`}
                      style={open ? { boxShadow: ISLAND_SHADOW } : undefined}
                    >
                      <span aria-hidden className={open ? "drop-shadow-sm group-hover:animate-wiggle" : "opacity-60 grayscale"}>
                        {open ? unit.emoji : "🔒"}
                      </span>
                      {count > 0 && (
                        <span
                          aria-hidden
                          className={`absolute -top-1 -right-1 grid size-8 animate-star place-items-center rounded-full border-2 border-ink text-sm ${count === 3 ? "bg-sun" : "bg-yay text-white"}`}
                          style={{ animationDelay: `${300 + index * 80}ms` }}
                        >
                          {count === 3 ? "👑" : "✓"}
                        </span>
                      )}
                    </span>
                  </span>
                  <span
                    className={`mt-2 rounded-full border-2 px-3 font-display text-lg font-semibold ${open ? `border-ink ${look.label}` : "border-dashed border-muted bg-white/70 text-muted"}`}
                  >
                    {name}
                  </span>
                  {open && <Stars count={count} label={fmt(m.map.stars, { n: count })} size="text-sm" />}
                </>
              );

              return (
                <Fragment key={unit.id}>
                  {tierStarts && (
                    <li className="w-full text-center">
                      <p className="inline-block rounded-full border-2 border-ink bg-white px-4 py-1 font-display text-sm font-bold tracking-wide uppercase shadow-chunky-sm">
                        {fmt(m.map.levelHeading, { n: unit.tier, name: m.levels[String(unit.tier) as "1" | "2" | "3"] })}
                      </p>
                    </li>
                  )}
                  <li className="relative" style={{ translate: `${offset}px 0` }}>
                    {index > 0 && !tierStarts && <Trail fromX={fromX} color={open ? look.trail : "#9ca3af"} />}
                    <div className="animate-pop" style={{ animationDelay: `${index * 80}ms` }}>
                      {open ? (
                        <Link href={`/lesson/${unit.id}`} className="group relative flex flex-col items-center gap-1 rounded-3xl p-1">
                          {node}
                        </Link>
                      ) : (
                        <div className="relative flex flex-col items-center gap-1 p-1">
                          {node}
                          <span className="sr-only">{m.map.locked}</span>
                        </div>
                      )}
                    </div>
                  </li>
                </Fragment>
              );
            })}
          </ol>
        </section>

        <aside className="flex flex-col gap-4 md:sticky md:top-20 md:self-start">
          <Card className="animate-pop bg-sun-soft p-5 text-center" style={{ animationDelay: "120ms" }}>
            <p className="font-display text-lg font-bold">✨ {m.map.todaysPick}</p>
            <p className="text-xs text-muted">{m.map.pickedForYou}</p>
            <p className="my-2 inline-block animate-float text-5xl" aria-hidden>{pick.emoji}</p>
            <p className="font-display text-2xl font-semibold">{m.units[pick.id]}</p>
            <p className="mb-3 text-sm text-muted">
              {fmt(m.map.minutes, { n: 5 })} · {fmt(m.map.wordsCount, { n: pick.seeds.length })}
            </p>
            <ButtonLink href={`/lesson/${pick.id}`} className="w-full">
              {m.map.start} →
            </ButtonLink>
          </Card>

          <Card className="animate-pop p-5 text-center" style={{ animationDelay: "220ms" }}>
            <p className={`inline-block text-4xl ${streak > 0 ? "animate-float" : ""}`} aria-hidden>🔥</p>
            <p className="font-display text-xl font-semibold">{fmt(m.map.streak, { n: streak })}</p>
            <ol className="mt-3 flex justify-between">
              {m.map.weekdays.map((day, i) => (
                <li key={i} className="flex flex-col items-center gap-1 text-xs text-muted">
                  <span
                    className={`size-7 rounded-full border-2 ${week[i] ? "animate-star border-ink bg-oops" : "border-dashed border-muted"}`}
                    style={week[i] ? { animationDelay: `${300 + i * 60}ms` } : undefined}
                  />
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

/** Dotted path from the island above (fromX px sideways) down to this one. */
function Trail({ fromX, color }: { fromX: number; color: string }) {
  const h = GAP + 8;
  return (
    <svg aria-hidden className="pointer-events-none absolute left-1/2 overflow-visible" style={{ top: -h }} width={1} height={h}>
      <path
        d={`M ${fromX} 0 C ${fromX} ${h * 0.6}, 0 ${h * 0.4}, 0 ${h}`}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray="0 12"
        opacity={0.55}
      />
    </svg>
  );
}
