"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { errorMessage, postJsonStream } from "@/lib/client/api";
import { useApp } from "./app-provider";
import { Mascot, Parrot } from "./ui";

type Message = { role: "user" | "assistant"; content: string };

const MAX_HISTORY = 20;
const MAX_LENGTH = 500;

// Pages with the bottom tab bar: the launcher sits above it.
const NAV_PAGES = ["/map", "/translate", "/profile"];
// Pages where a floating button would cover the main controls or give away answers.
const HIDDEN_PAGES = ["/lesson", "/check", "/chat", "/login", "/forgot-password", "/reset-password"];

/** Floating "Ask Bolo" helper in the bottom-right corner, kept open across pages. */
export function HelperWidget() {
  const { status } = useApp();
  const pathname = usePathname();
  if (status !== "ready" || HIDDEN_PAGES.some((page) => pathname.startsWith(page))) return null;
  const aboveNav = NAV_PAGES.some((page) => pathname.startsWith(page));
  return <Helper aboveNav={aboveNav} />;
}

function Helper({ aboveNav }: { aboveNav: boolean }) {
  const { native, target, course, m } = useApp();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLOListElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const titleId = useId();
  const wasOpen = useRef(false);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else if (wasOpen.current) launcherRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, busy, error]);

  async function ask(question: string) {
    const text = question.trim().slice(0, MAX_LENGTH);
    if (!text || busy) return;
    const history: Message[] = [...messages, { role: "user", content: text }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setDraft("");
    setError(null);
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;
    const showPartial = (partial: string) =>
      setMessages((list) => [...list.slice(0, -1), { role: "assistant", content: partial }]);
    try {
      const answer = await postJsonStream(
        "/api/helper",
        { target, native, level: course?.level ?? 1, messages: history.slice(-MAX_HISTORY) },
        showPartial,
        controller.signal,
      );
      setAnnounce(answer);
    } catch (e) {
      if (controller.signal.aborted) return;
      // Drop the empty or half-written answer and give the question back to edit.
      setMessages(messages);
      setDraft(text);
      setError(errorMessage(e, m));
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setBusy(false);
      }
    }
  }

  function send(event: FormEvent) {
    event.preventDefault();
    void ask(draft);
  }

  function clear() {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
    setMessages([]);
    setError(null);
    setDraft("");
    inputRef.current?.focus();
  }

  const bottom = aboveNav ? "bottom-[calc(5rem+env(safe-area-inset-bottom))]" : "bottom-[calc(1rem+env(safe-area-inset-bottom))]";
  const waiting = busy && messages.at(-1)?.content === "";

  if (!open) {
    return (
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={m.helper.open}
        title={m.helper.open}
        className={`chunky press animate-pop fixed right-4 z-20 flex size-14 items-center justify-center gap-2 rounded-full bg-sun text-3xl sm:w-auto sm:px-4 ${bottom}`}
      >
        <Parrot className="size-10" />
        <span aria-hidden className="hidden font-display text-lg font-bold sm:inline">{m.helper.open}</span>
      </button>
    );
  }

  return (
    <section
      role="dialog"
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
      className={`chunky animate-pop fixed inset-x-2 z-20 flex h-[min(560px,calc(100dvh-8rem))] flex-col overflow-hidden rounded-3xl bg-paper sm:right-4 sm:left-auto sm:w-96 ${bottom}`}
    >
      <header className="flex items-center gap-3 border-b-2 border-ink bg-sun px-4 py-3">
        <Mascot className="size-10 bg-white text-2xl" />
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="font-display text-xl leading-tight font-bold">{m.helper.title}</h2>
          <p className="truncate text-sm">{m.helper.subtitle}</p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clear}
            title={m.helper.clear}
            aria-label={m.helper.clear}
            className="grid size-9 place-items-center rounded-full text-lg hover:bg-white/60"
          >
            <span aria-hidden>↺</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={m.common.close}
          className="grid size-9 place-items-center rounded-full text-xl hover:bg-white/60"
        >
          <span aria-hidden>✕</span>
        </button>
      </header>

      <ol ref={logRef} role="log" aria-busy={busy} className="flex flex-1 flex-col gap-3 overflow-y-auto overscroll-contain p-4">
        <li className="flex items-start gap-2">
          <Mascot className="size-8 text-lg" />
          <p className="rounded-2xl rounded-tl-sm border-2 border-ink bg-white px-3 py-2">{m.helper.greeting}</p>
        </li>
        {messages.length === 0 && (
          <li className="flex flex-col items-end gap-2 pt-1">
            {m.helper.starters.map((starter) => (
              <button
                key={starter}
                type="button"
                onClick={() => ask(starter)}
                className="press rounded-full border-2 border-ink bg-white px-3 py-1.5 text-left text-sm font-semibold shadow-chunky-sm hover:bg-sky-50"
              >
                {starter}
              </button>
            ))}
          </li>
        )}
        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <li key={i} className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-tr-sm border-2 border-ink bg-sky-100 px-3 py-2 whitespace-pre-wrap">{msg.content}</p>
            </li>
          ) : msg.content ? (
            <li key={i} className="flex items-start gap-2">
              <Mascot className="size-8 text-lg" />
              <p className="max-w-[85%] rounded-2xl rounded-tl-sm border-2 border-ink bg-white px-3 py-2 whitespace-pre-wrap">{msg.content}</p>
            </li>
          ) : null,
        )}
        {waiting && (
          <li className="flex items-center gap-2">
            <Mascot className="size-8 text-lg" />
            <span className="flex gap-1 rounded-2xl rounded-tl-sm border-2 border-ink bg-white px-3 py-3">
              <span className="sr-only">{m.helper.thinking}</span>
              {[0, 1, 2].map((d) => (
                <span key={d} aria-hidden className="size-2 rounded-full bg-ink motion-safe:animate-typing" style={{ animationDelay: `${d * 150}ms` }} />
              ))}
            </span>
          </li>
        )}
        {error && (
          <li role="alert" className="rounded-2xl border-2 border-ink bg-oops-soft px-3 py-2 text-center text-sm font-semibold">
            {error}
          </li>
        )}
      </ol>
      <p aria-live="polite" className="sr-only">{announce}</p>

      <form onSubmit={send} className="flex gap-2 border-t-2 border-ink bg-white p-3">
        <label htmlFor={`${titleId}-input`} className="sr-only">{m.helper.placeholder}</label>
        <input
          id={`${titleId}-input`}
          ref={inputRef}
          value={draft}
          maxLength={MAX_LENGTH}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={m.helper.placeholder}
          autoComplete="off"
          className="min-h-11 min-w-0 flex-1 rounded-2xl border-2 border-ink bg-white px-3 outline-none focus-visible:ring-3 focus-visible:ring-brand"
        />
        <button
          type="submit"
          disabled={!draft.trim() || busy}
          aria-label={m.helper.send}
          className="chunky press grid size-11 shrink-0 place-items-center rounded-2xl bg-brand text-lg text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span aria-hidden>➤</span>
        </button>
      </form>
    </section>
  );
}
