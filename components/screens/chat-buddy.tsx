"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useRecorder } from "@/hooks/use-recorder";
import { errorMessage, postJson, transcribeAudio } from "@/lib/client/api";
import { speak } from "@/lib/client/speech";
import { fmt } from "@/lib/i18n";
import { LANGS, type TargetLang } from "@/lib/languages";
import { useApp } from "../app-provider";
import { BottomNav, TopBar } from "../app-shell";
import { Button, IconButton, Mascot, Notice } from "../ui";

type Message = { role: "user" | "assistant"; content: string; translation?: string };
type Suggestion = { text: string; translation: string };
type ChatReply = { reply: string; translation: string; suggestions: Suggestion[] };

const MAX_HISTORY = 20;
const MAX_LENGTH = 500;

export function ChatBuddy() {
  const { target } = useApp();
  // CourseGate guarantees a target; remount when it changes.
  return <Chat key={target} target={target as TargetLang} />;
}

function Chat({ target }: { target: TargetLang }) {
  const { native, course, m } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [shown, setShown] = useState<Set<number>>(new Set());
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const started = useRef(false);
  const buddy = LANGS[target].buddy;
  const level = course?.level ?? 1;

  const ask = useCallback(
    async (history: Message[]) => {
      setBusy(true);
      setError(null);
      try {
        const reply = await postJson<ChatReply>("/api/chat", {
          target,
          native,
          level,
          messages: history.slice(-MAX_HISTORY).map(({ role, content }) => ({ role, content })),
        });
        setMessages([...history, { role: "assistant", content: reply.reply, translation: reply.translation }]);
        setSuggestions(reply.suggestions);
      } catch (e) {
        setError(errorMessage(e, m));
      } finally {
        setBusy(false);
      }
    },
    [target, native, level, m],
  );

  useEffect(() => {
    // Effects run twice in development; greet only once.
    if (started.current) return;
    started.current = true;
    void ask([]);
  }, [ask]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  const recorder = useRecorder(async (clip) => {
    try {
      const text = await transcribeAudio(clip, target);
      if (text) setDraft((d) => `${d} ${text}`.trim().slice(0, MAX_LENGTH));
    } catch (e) {
      setError(errorMessage(e, m));
    }
  });

  function send(event?: FormEvent) {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    setSuggestions([]);
    setHelpOpen(false);
    inputRef.current?.focus();
    void ask([...messages, { role: "user", content: text }]);
  }

  function restart() {
    setMessages([]);
    setSuggestions([]);
    setShown(new Set());
    void ask([]);
  }

  const toggle = (index: number) =>
    setShown((s) => {
      const next = new Set(s);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  const helpPanel = (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted">{m.chat.tapToUse}</p>
      {suggestions.map((s) => (
        <button
          key={s.text}
          type="button"
          onClick={() => {
            setDraft(s.text);
            setHelpOpen(false);
            inputRef.current?.focus();
          }}
          className="press group flex flex-col rounded-2xl border-2 border-ink bg-white p-3 text-left hover:bg-sky-50"
        >
          <span lang={target} className="font-semibold">{s.text}</span>
          <span className="text-sm text-muted">{s.translation}</span>
          <span aria-hidden className="mt-2 self-end rounded-lg bg-brand px-3 py-1 text-sm font-semibold text-white group-hover:bg-brand-dark">
            {m.chat.useIt} ↵
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <>
      <TopBar>
        <button type="button" onClick={restart} disabled={busy} className="text-sm font-semibold text-brand disabled:opacity-50">
          {m.chat.restart}
        </button>
      </TopBar>
      <main className="mx-auto grid max-w-5xl gap-6 px-4 pt-4 pb-28 md:grid-cols-[1fr_280px]">
        <section className="flex min-h-[60dvh] flex-col">
          <div className="mb-4 flex items-center gap-3">
            <Mascot className="animate-float" />
            <div>
              <h1 className="font-display text-2xl font-bold">{fmt(m.chat.title, { name: buddy })}</h1>
              <p className="text-sm text-muted">{fmt(m.chat.mode, { lang: m.languages[target] })}</p>
            </div>
          </div>

          <ol className="flex flex-1 flex-col gap-4" aria-live="polite">
            {messages.map((msg, i) =>
              msg.role === "assistant" ? (
                <li key={i} className="animate-pop flex items-start gap-2">
                  <Mascot className="size-9 text-xl" />
                  <div className="max-w-[80%]">
                    <div className="chunky rounded-2xl rounded-tl-sm bg-white px-4 py-3">
                      <p lang={target} className="text-lg">{msg.content}</p>
                    </div>
                    {shown.has(i) && msg.translation && (
                      <p className="mt-1 rounded-xl border-2 border-dashed border-ink bg-sun-soft px-3 py-1 text-sm">{msg.translation}</p>
                    )}
                    {i === 0 && !shown.has(0) && <p className="mt-1 text-xs text-muted">{m.chat.tapGlobe}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <IconButton onClick={() => toggle(i)} aria-pressed={shown.has(i)} aria-label={m.chat.showTranslation}>
                      <span aria-hidden>🌐</span>
                    </IconButton>
                    <IconButton onClick={() => speak(msg.content, target)} aria-label={m.translate.listen}>
                      <span aria-hidden>🔊</span>
                    </IconButton>
                  </div>
                </li>
              ) : (
                <li key={i} className="animate-pop flex justify-end">
                  <p lang={target} className="chunky max-w-[80%] rounded-2xl rounded-tr-sm bg-sky-100 px-4 py-3 text-lg">
                    {msg.content}
                  </p>
                </li>
              ),
            )}
            {busy && (
              <li className="flex items-center gap-2">
                <Mascot className="size-9 text-xl" />
                <span role="status" className="chunky flex gap-1 rounded-2xl rounded-tl-sm bg-white px-4 py-4">
                  <span className="sr-only">{fmt(m.chat.typing, { name: buddy })}</span>
                  {[0, 1, 2].map((d) => (
                    <span key={d} aria-hidden className="size-2 rounded-full bg-ink motion-safe:animate-typing" style={{ animationDelay: `${d * 150}ms` }} />
                  ))}
                </span>
              </li>
            )}
          </ol>
          <div ref={endRef} />

          {error && <div className="mt-4"><Notice tone="error">{error}</Notice></div>}

          {suggestions.length > 0 && (
            <div className="mt-4 md:hidden">
              <Button variant="secondary" className="w-full bg-sun-soft" onClick={() => setHelpOpen((o) => !o)} aria-expanded={helpOpen}>
                🆘 {m.chat.helpReply}
              </Button>
              {helpOpen && <div className="mt-3">{helpPanel}</div>}
            </div>
          )}

          <form onSubmit={send} className="sticky bottom-[calc(4.25rem+env(safe-area-inset-bottom))] -mx-4 mt-4 flex gap-2 bg-white/70 px-4 pt-2 pb-3 backdrop-blur-md">
            <label htmlFor="chat-input" className="sr-only">{fmt(m.chat.placeholder, { lang: m.languages[target] })}</label>
            <input
              id="chat-input"
              ref={inputRef}
              lang={target}
              value={draft}
              maxLength={MAX_LENGTH}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={fmt(m.chat.placeholder, { lang: m.languages[target] })}
              autoComplete="off"
              className="chunky min-h-12 flex-1 rounded-2xl bg-white px-4 text-lg outline-none focus-visible:ring-3 focus-visible:ring-brand"
            />
            <button
              type="button"
              onClick={recorder.state === "recording" ? recorder.stop : recorder.start}
              aria-label={recorder.state === "recording" ? m.chat.stop : m.chat.speak}
              className={`chunky press grid size-12 place-items-center rounded-2xl text-2xl ${recorder.state === "recording" ? "bg-oops motion-safe:animate-pulse" : "bg-oops-soft"}`}
            >
              <span aria-hidden>{recorder.state === "recording" ? "⏹️" : "🎤"}</span>
            </button>
            <Button type="submit" disabled={!draft.trim() || busy} aria-label={m.chat.send} className="px-4">
              ➤
            </Button>
          </form>
        </section>

        <aside className="hidden md:block">
          <div className="chunky sticky top-20 rounded-3xl bg-sun-soft p-4">
            <p className="mb-1 font-display text-lg font-bold">🆘 {m.chat.helpReply}</p>
            {helpPanel}
          </div>
        </aside>
      </main>
      <BottomNav />
    </>
  );
}
