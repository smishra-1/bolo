import type { CSSProperties, ReactNode } from "react";

/**
 * Faint language doodles around the edges of the screen: greetings in speech
 * bubbles, letters from different scripts and a globe. Purely decorative, kept
 * to the margins so they never sit behind text. Most hide on small screens,
 * where content uses the full width.
 */

type Doodle = { style: CSSProperties; className?: string; rotate: number; children: ReactNode };

function Bubble({ text, lang, tail = "left" }: { text: string; lang: string; tail?: "left" | "right" }) {
  const width = Math.max(64, text.length * 13 + 28);
  const tailPath = tail === "left" ? "M18 44 L14 58 L32 44" : `M${width - 18} 44 L${width - 14} 58 L${width - 32} 44`;
  return (
    <svg width={width} height={62} viewBox={`0 0 ${width} 62`} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinejoin="round">
      <rect x={2} y={2} width={width - 4} height={42} rx={14} />
      <path d={tailPath} fill="var(--color-paper)" />
      <text x={width / 2} y={30} textAnchor="middle" fill="currentColor" stroke="none" lang={lang} className="font-display text-lg font-bold">
        {text}
      </text>
    </svg>
  );
}

function Glyph({ char, lang, size = "text-5xl" }: { char: string; lang: string; size?: string }) {
  return (
    <span lang={lang} className={`font-display font-bold ${size}`}>
      {char}
    </span>
  );
}

function Globe() {
  return (
    <svg width={56} height={56} viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <circle cx={28} cy={28} r={24} />
      <ellipse cx={28} cy={28} rx={10} ry={24} />
      <path d="M4 28h48M8 16h40M8 40h40" />
    </svg>
  );
}

function Book() {
  return (
    <svg width={56} height={44} viewBox="0 0 56 44" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinejoin="round">
      <path d="M28 8C22 3 12 3 4 5v34c8-2 18-2 24 3 6-5 16-5 24-3V5c-8-2-18-2-24 3z" />
      <path d="M28 8v34" />
    </svg>
  );
}

function SoundWaves() {
  return (
    <svg width={52} height={44} viewBox="0 0 52 44" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 16h8l10-9v30l-10-9H4z" />
      <path d="M31 15a9 9 0 0 1 0 14M37 9a17 17 0 0 1 0 26M43 4a24 24 0 0 1 0 36" />
    </svg>
  );
}

function Sparkle() {
  return (
    <svg width={30} height={30} viewBox="0 0 30 30" fill="currentColor">
      <path d="M15 1l3.5 10.5L29 15l-10.5 3.5L15 29l-3.5-10.5L1 15l10.5-3.5z" />
    </svg>
  );
}

const DOODLES: Doodle[] = [
  { style: { top: "14%", left: "2.5%" }, rotate: -8, className: "text-brand", children: <Bubble text="Hola!" lang="es" /> },
  { style: { top: "40%", left: "4%" }, rotate: 10, className: "text-pink-600", children: <Glyph char="あ" lang="ja" /> },
  { style: { top: "62%", left: "1.5%" }, rotate: -4, className: "text-green-700", children: <Bubble text="Bonjour" lang="fr" /> },
  { style: { bottom: "12%", left: "5%" }, rotate: 6, className: "text-orange-600", children: <Glyph char="ñ" lang="es" /> },
  { style: { top: "12%", right: "3%" }, rotate: 12, className: "text-violet-600", children: <Glyph char="अ" lang="hi" /> },
  { style: { top: "34%", right: "2%" }, rotate: 6, className: "text-orange-600", children: <Bubble text="नमस्ते" lang="hi" tail="right" /> },
  { style: { top: "58%", right: "4.5%" }, rotate: -10, className: "text-brand", children: <Globe /> },
  { style: { bottom: "14%", right: "2.5%" }, rotate: -6, className: "text-pink-600", children: <Bubble text="Hallo!" lang="de" tail="right" /> },
  { style: { bottom: "3%", left: "3%" }, rotate: -12, className: "text-violet-600", children: <Glyph char="ü" lang="de" size="text-4xl" /> },
  { style: { bottom: "4%", right: "4%" }, rotate: 8, className: "text-brand", children: <Sparkle /> },
  // Second column, closer to the content: only where the margins are wide enough.
  { style: { top: "4%", left: "9%" }, rotate: 14, className: "text-amber-500", children: <Sparkle /> },
  { style: { top: "27%", left: "8.5%" }, rotate: -6, className: "text-teal-600", children: <Book /> },
  { style: { top: "50%", left: "9%" }, rotate: 8, className: "text-brand", children: <Glyph char="é" lang="fr" size="text-4xl" /> },
  { style: { top: "75%", left: "8%" }, rotate: 4, className: "text-violet-600", children: <Bubble text="Ciao!" lang="it" /> },
  { style: { top: "4%", right: "10%" }, rotate: -8, className: "text-green-700", children: <Bubble text="Olá!" lang="pt" tail="right" /> },
  { style: { top: "23%", right: "9%" }, rotate: 6, className: "text-pink-600", children: <Sparkle /> },
  { style: { top: "46%", right: "9.5%" }, rotate: -4, className: "text-amber-600", children: <Glyph char="ß" lang="de" size="text-4xl" /> },
  { style: { top: "70%", right: "10%" }, rotate: 10, className: "text-teal-600", children: <SoundWaves /> },
  { style: { bottom: "30%", right: "1.5%" }, rotate: -14, className: "text-violet-600", children: <Glyph char="字" lang="zh" size="text-4xl" /> },
  { style: { bottom: "4%", left: "12%" }, rotate: 6, className: "text-orange-600", children: <Bubble text="Hi!" lang="en" /> },
  { style: { bottom: "3%", right: "12%" }, rotate: -4, className: "text-brand", children: <Glyph char="Ç" lang="fr" size="text-4xl" /> },
];

// The few that stay on phones sit in the very corners, at the top and bottom edges.
const ON_MOBILE = new Set([0, 4, 8, 9]);
const SECOND_COLUMN_FROM = 10;

export function BackgroundDecor() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none">
      {DOODLES.map((doodle, i) => (
        <div
          key={i}
          className={`absolute opacity-[0.13] ${doodle.className ?? ""} ${
            ON_MOBILE.has(i) ? "max-lg:scale-75 max-lg:opacity-[0.09]" : i >= SECOND_COLUMN_FROM ? "hidden 2xl:block" : "hidden lg:block"
          }`}
          style={{ ...doodle.style, rotate: `${doodle.rotate}deg` }}
        >
          {doodle.children}
        </div>
      ))}
    </div>
  );
}
