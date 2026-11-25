"use client";

import Link from "next/link";
import { useProgress } from "@/hooks/use-progress";
import { fmt } from "@/lib/i18n";
import { isPartUnlocked } from "@/lib/progress";
import { PARTS, getUnit, type Part, type UnitId } from "@/lib/units";
import { useApp } from "../app-provider";
import { Card, Spinner, Stars } from "../ui";

const ICON: Record<Part, string> = { words: "📖", sentences: "🧱", test: "🏆" };

/** A unit's three parts: learn the words, build sentences, then take the test. */
export function UnitHub({ unitId }: { unitId: UnitId }) {
  const { target, m } = useApp();
  const { stars, loaded } = useProgress();
  const unit = getUnit(unitId)!;
  if (!target) return null;
  if (!loaded) return <Spinner label={m.common.loading} />;

  const progress = stars[unitId];
  const text: Record<Part, { title: string; body: string; locked: string }> = {
    words: { title: m.unit.wordsTitle, body: fmt(m.unit.wordsBody, { n: unit.seeds.length }), locked: "" },
    sentences: { title: m.unit.sentencesTitle, body: m.unit.sentencesBody, locked: m.unit.lockedSentences },
    test: { title: m.unit.testTitle, body: m.unit.testBody, locked: m.unit.lockedTest },
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-6 px-4 py-6">
      <header className="flex items-center gap-3">
        <Link href="/map" aria-label={m.unit.back} className="grid size-10 place-items-center rounded-full text-2xl text-muted hover:bg-white">←</Link>
        <div>
          <p className="text-sm font-semibold text-muted">{m.languages[target]}</p>
          <h1 className="font-display text-3xl font-bold">
            <span aria-hidden>{unit.emoji} </span>
            {m.units[unitId]}
          </h1>
        </div>
      </header>

      <ol className="flex flex-col gap-4">
        {PARTS.map((part, i) => {
          const open = isPartUnlocked(part, progress);
          const count = progress?.[part] ?? 0;
          const body = (
            <Card className={`flex items-center gap-4 p-5 ${open ? "" : "border-dashed bg-white/60 text-muted"}`}>
              <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-2xl border-2 border-ink bg-sun-soft text-3xl">
                {open ? ICON[part] : "🔒"}
              </span>
              <span className="flex-1 text-left">
                <span className="block text-xs font-bold tracking-wide uppercase">{fmt(m.unit.partOf, { n: i + 1, total: PARTS.length })}</span>
                <span className="block font-display text-2xl font-semibold">{text[part].title}</span>
                <span className="block text-sm text-muted">{open ? text[part].body : text[part].locked}</span>
              </span>
              {open && (
                <span className="flex flex-col items-end gap-1">
                  <Stars count={count} label={fmt(m.map.stars, { n: count })} size="text-sm" />
                  <span className="font-display font-semibold text-brand">{count > 0 ? m.unit.again : m.map.start} →</span>
                </span>
              )}
            </Card>
          );
          return (
            <li key={part} className="animate-pop" style={{ animationDelay: `${i * 90}ms` }}>
              {open ? (
                <Link href={`/lesson/${unitId}/${part}`} className="press block rounded-3xl">
                  {body}
                </Link>
              ) : (
                <div>
                  {body}
                  <span className="sr-only">{m.map.locked}</span>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </main>
  );
}
