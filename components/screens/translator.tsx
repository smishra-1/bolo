"use client";

import { useState, type FormEvent } from "react";
import { useRecorder } from "@/hooks/use-recorder";
import { errorMessage, postJson, transcribeAudio } from "@/lib/client/api";
import { speak } from "@/lib/client/speech";
import { NATIVE_LANGS, isNativeLang, type NativeLang } from "@/lib/languages";
import { useApp } from "../app-provider";
import { BottomNav, TopBar } from "../app-shell";
import { Button, Card, Notice } from "../ui";

type Result = { translation: string; romanization: string | null; note: string | null };

const MAX_LENGTH = 500;

export function Translator() {
  const { native, target, m } = useApp();
  // NATIVE_LANGS includes every language Bolo teaches.
  const [from, setFrom] = useState<NativeLang | "auto">(native);
  const [to, setTo] = useState<NativeLang>(target ?? "es");
  const [text, setText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recorder = useRecorder(async (clip) => {
    setError(null);
    try {
      const heard = await transcribeAudio(clip, from === "auto" ? native : from);
      if (heard) setText(heard.slice(0, MAX_LENGTH));
    } catch (e) {
      setError(errorMessage(e, m));
    }
  });

  async function translate(event: FormEvent) {
    event.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await postJson<Result>("/api/translate", { text: text.trim(), from, to }));
    } catch (e) {
      setError(errorMessage(e, m));
    } finally {
      setBusy(false);
    }
  }

  function swap() {
    if (from === "auto") return;
    setFrom(to);
    setTo(from);
    if (result) setText(result.translation.slice(0, MAX_LENGTH));
    setResult(null);
  }

  const select = "chunky min-h-12 rounded-2xl bg-white px-3 font-semibold";
  const recording = recorder.state === "recording";

  return (
    <>
      <TopBar />
      <main className="mx-auto flex max-w-2xl flex-col gap-5 px-4 pt-6 pb-28">
        <div>
          <h1 className="font-display text-3xl font-bold">🌐 {m.translate.title}</h1>
          <p className="text-muted">{m.translate.subtitle}</p>
        </div>

        <form onSubmit={translate} className="flex flex-col gap-4">
          <div className="flex items-end gap-2">
            <label className="flex flex-1 flex-col gap-1 text-sm font-semibold">
              {m.translate.from}
              <select className={select} value={from} onChange={(e) => setFrom(isNativeLang(e.target.value) ? e.target.value : "auto")}>
                <option value="auto">{m.translate.auto}</option>
                {NATIVE_LANGS.map((lang) => (
                  <option key={lang} value={lang}>{m.languages[lang]}</option>
                ))}
              </select>
            </label>
            <button type="button" onClick={swap} disabled={from === "auto"} aria-label={m.translate.swap} className="chunky press grid size-12 place-items-center rounded-2xl bg-white text-xl disabled:opacity-40">
              ⇄
            </button>
            <label className="flex flex-1 flex-col gap-1 text-sm font-semibold">
              {m.translate.to}
              <select className={select} value={to} onChange={(e) => isNativeLang(e.target.value) && setTo(e.target.value)}>
                {NATIVE_LANGS.map((lang) => (
                  <option key={lang} value={lang}>{m.languages[lang]}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="relative">
            <label htmlFor="translate-input" className="sr-only">{m.translate.placeholder}</label>
            <textarea
              id="translate-input"
              value={text}
              maxLength={MAX_LENGTH}
              onChange={(e) => setText(e.target.value)}
              placeholder={m.translate.placeholder}
              rows={4}
              className="chunky w-full resize-none rounded-3xl bg-white p-4 pr-16 text-lg outline-none focus-visible:ring-3 focus-visible:ring-brand"
            />
            <button
              type="button"
              onClick={recording ? recorder.stop : recorder.start}
              aria-label={recording ? m.translate.stop : m.translate.speak}
              className={`absolute right-3 bottom-4 grid size-11 place-items-center rounded-full border-2 border-ink text-xl ${recording ? "bg-oops motion-safe:animate-pulse" : "bg-oops-soft"}`}
            >
              <span aria-hidden>{recording ? "⏹️" : "🎤"}</span>
            </button>
          </div>

          <Button type="submit" disabled={!text.trim() || busy}>
            {busy ? m.lesson.thinking : m.translate.translate}
          </Button>
        </form>

        {error && <Notice tone="error">{error}</Notice>}

        {result && (
          <Card className="animate-pop flex flex-col gap-2 p-5" aria-live="polite">
            <p className="text-sm font-semibold text-muted">{m.translate.result}</p>
            <p lang={to} className="font-display text-3xl font-semibold">{result.translation}</p>
            {result.romanization && <p className="text-muted">{result.romanization}</p>}
            {result.note && <p className="rounded-2xl border-2 border-dashed border-ink bg-sun-soft px-3 py-2 text-sm">💡 {result.note}</p>}
            <Button variant="secondary" className="self-start" onClick={() => speak(result.translation, to)}>
              🔊 {m.translate.listen}
            </Button>
          </Card>
        )}
      </main>
      <BottomNav />
    </>
  );
}
