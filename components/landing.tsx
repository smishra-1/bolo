import Link from "next/link";
import type { ReactNode } from "react";
import { LANGS, TARGET_LANGS } from "@/lib/languages";
import { UNITS } from "@/lib/units";
import { ButtonLink, LogoImage, Parrot } from "./ui";

const STEPS = [
  { emoji: "🌍", title: "Pick a language", body: "Choose from 30 languages, from Spanish and Japanese to Hindi, Tamil and Swahili. Take a quick check so we start at the right level.", tint: "bg-sun-soft" },
  { emoji: "🎤", title: "Play and speak", body: "Short lessons mix tapping, matching and saying words out loud, so speaking is never an afterthought.", tint: "bg-yay-soft" },
  { emoji: "🔥", title: "Build a streak", body: "Earn stars, climb the learning map and come back tomorrow. Five minutes a day adds up.", tint: "bg-oops-soft" },
];

const FEATURES = [
  { emoji: "🗣️", title: "Instant speaking feedback", body: "Say it, and Bolo listens. You get friendly, specific tips on your pronunciation right away.", span: "sm:col-span-2", tint: "bg-sky-100" },
  { emoji: "💬", title: "Chat buddy", body: "Practice real conversations with a patient AI friend who never gets tired of your mistakes.", span: "", tint: "bg-pink-100" },
  { emoji: "🌐", title: "Built-in translator", body: "Stuck on a word? Translate it, hear it, and learn why it works.", span: "", tint: "bg-green-100" },
  { emoji: "🗺️", title: "A map that keeps you going", body: "Units unlock as you learn. Every node on the path is a small win you can see.", span: "sm:col-span-2", tint: "bg-yellow-100" },
];

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="mb-2 font-display text-sm font-bold uppercase tracking-widest text-brand">{children}</p>;
}

function Bubble({ who, children, lang, className = "" }: { who: "bolo" | "you"; children: ReactNode; lang?: string; className?: string }) {
  const mine = who === "you";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"} ${className}`}>
      <p
        lang={lang}
        className={`max-w-[85%] rounded-2xl border-2 border-ink px-4 py-2 font-display text-lg font-semibold ${
          mine ? "rounded-br-sm bg-brand text-white" : "rounded-bl-sm bg-white"
        }`}
      >
        {children}
      </p>
    </div>
  );
}

/** A little phone-style preview of a lesson, so visitors see the app before signing up. */
function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-sm" aria-hidden>
      <div className="absolute -right-3 -top-5 z-10 animate-float rounded-full border-2 border-ink bg-sun px-3 py-1 font-display text-base font-bold shadow-chunky-sm">
        🔥 7 day streak
      </div>
      <div className="chunky rotate-2 rounded-[2rem] bg-white p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-4 flex-1 overflow-hidden rounded-full border-2 border-ink">
            <div className="h-full w-2/3 rounded-full bg-yay shadow-[inset_0_-3px_0_0_rgb(0_0_0/0.15)]" />
          </div>
          <span className="font-display font-semibold">⭐ 120</span>
        </div>
        <div className="flex flex-col gap-3">
          <Bubble who="bolo" lang="es" className="animate-pop">¡Hola! ¿Cómo te llamas?</Bubble>
          <Bubble who="you" className="animate-pop [animation-delay:250ms]">Me llamo Sam 🙂</Bubble>
          <Bubble who="bolo" lang="es" className="animate-pop [animation-delay:500ms]">¡Mucho gusto, Sam!</Bubble>
        </div>
        <div className="mt-5 flex items-center gap-3 rounded-2xl border-2 border-ink bg-yay-soft p-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-ink bg-yay text-xl text-white">🎤</span>
          <p className="font-display text-base font-semibold leading-tight">
            Great accent! <span className="text-muted">Try rolling the “r” a little more.</span>
          </p>
        </div>
      </div>
      <Parrot className="absolute -bottom-8 -left-6 size-24 animate-float [animation-delay:600ms]" />
    </div>
  );
}

export function Landing() {
  return (
    <>
      <header className="sticky top-0 z-10 border-b-2 border-ink bg-white/75 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/" aria-label="Bolo home">
            <LogoImage className="h-10" />
          </Link>
          <nav aria-label="Main" className="flex items-center gap-2 font-display font-semibold sm:gap-5">
            <a href="#how" className="hidden hover:text-brand sm:inline">How it works</a>
            <a href="#features" className="hidden hover:text-brand sm:inline">Features</a>
            <Link href="/login" className="rounded-full px-3 py-1.5 hover:bg-sun-soft">Log in</Link>
            <ButtonLink href="/start" className="min-h-10! rounded-xl! px-4! text-base!">Start free</ButtonLink>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:pt-20">
          <div className="text-center lg:text-left">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-sun px-4 py-1 font-display text-sm font-bold shadow-chunky-sm">
              <span aria-hidden>✨</span> Free, and powered by AI
            </p>
            <h1 className="font-display text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl">
              Learn a language by{" "}
              <span className="relative inline-block text-brand">
                speaking
                <svg aria-hidden viewBox="0 0 200 12" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-1 h-3 w-full text-oops">
                  <path d="M2 8c30-8 60 4 98-1s60-5 98-1" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>{" "}
              it.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-xl text-muted lg:mx-0">
              Bolo is the playful language buddy that gets you talking from day one. Bite-sized lessons, instant feedback on your pronunciation, and a chat friend who is always up for a conversation.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <ButtonLink href="/start" className="min-h-14 whitespace-nowrap px-7 text-xl">Start learning free →</ButtonLink>
              <ButtonLink href="/login" variant="secondary" className="min-h-14 whitespace-nowrap px-7 text-xl">I have an account</ButtonLink>
            </div>
            <p className="mt-4 text-sm text-muted">No card needed. Takes about a minute to begin.</p>
          </div>
          <HeroPreview />
        </section>

        <section aria-label="Languages you can learn" className="border-y-2 border-ink bg-white py-5">
          <ul className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4">
            {TARGET_LANGS.map((lang) => (
              <li key={lang} className="flex items-baseline gap-2 font-display">
                <span lang={lang} className="text-2xl font-bold">{LANGS[lang].greeting}</span>
                <span className="text-muted">{LANGS[lang].english}</span>
              </li>
            ))}
          </ul>
        </section>

        <section id="how" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20">
          <div className="mb-12 text-center">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="font-display text-4xl font-bold sm:text-5xl">Three steps to your first conversation</h2>
          </div>
          <ol className="grid gap-8 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className={`chunky relative rounded-3xl p-6 pt-8 ${step.tint}`}>
                <span aria-hidden className="absolute -top-4 left-6 grid size-9 place-items-center rounded-full border-2 border-ink bg-white font-display text-lg font-bold">{i + 1}</span>
                <span aria-hidden className="text-5xl">{step.emoji}</span>
                <h3 className="mt-3 font-display text-2xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-lg text-ink/80">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="features" className="mx-auto max-w-6xl scroll-mt-16 px-4 pb-20">
          <div className="mb-12 text-center">
            <Eyebrow>Everything in one place</Eyebrow>
            <h2 className="font-display text-4xl font-bold sm:text-5xl">Made for people who want to actually talk</h2>
          </div>
          <ul className="grid gap-6 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <li key={f.title} className={`chunky group rounded-3xl p-6 ${f.span} ${f.tint}`}>
                <span aria-hidden className="inline-block text-5xl group-hover:animate-wiggle">{f.emoji}</span>
                <h3 className="mt-3 font-display text-2xl font-semibold">{f.title}</h3>
                <p className="mt-2 text-lg text-ink/80">{f.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="units-title" className="border-y-2 border-ink bg-sun-soft py-20">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <Eyebrow>What you&apos;ll learn</Eyebrow>
            <h2 id="units-title" className="font-display text-4xl font-bold sm:text-5xl">24 units, from your first hello to talking about travel</h2>
            <ul className="mt-10 flex flex-wrap justify-center gap-3">
              {UNITS.map((unit, i) => (
                <li key={unit.id} className={`rounded-full border-2 border-ink bg-white px-5 py-2.5 font-display text-xl font-semibold shadow-chunky-sm ${i % 2 ? "-rotate-1" : "rotate-1"}`}>
                  <span aria-hidden>{unit.emoji}</span> <span className="capitalize">{unit.id}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-24">
          <div className="chunky relative overflow-hidden rounded-[2.5rem] bg-brand p-10 text-center text-white sm:p-16">
            <Parrot className="absolute -left-4 -top-6 size-24 opacity-20" />
            <h2 className="relative font-display text-4xl font-bold sm:text-5xl">Ready to say your first word?</h2>
            <p className="relative mx-auto mt-4 max-w-md text-xl text-white/90">Pick a language and be speaking in minutes.</p>
            <ButtonLink href="/start" variant="secondary" className="relative mt-8 min-h-14 px-8 text-xl">Start learning free →</ButtonLink>
          </div>
        </section>
      </main>

      <footer className="border-t-2 border-ink bg-white py-8 text-center text-sm text-muted">
        <LogoImage className="mx-auto h-10" />
        <p className="mt-1">Made with ❤️ by Shobhit, Vardaan, Reyansh &amp; Gaurang</p>
      </footer>
    </>
  );
}
