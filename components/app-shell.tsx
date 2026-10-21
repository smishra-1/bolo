"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useApp } from "./app-provider";
import { LogoImage, Notice, Spinner } from "./ui";

/** Sends signed-out visitors to /login and shows a loading state until a language is picked. */
export function CourseGate({ children }: { children: ReactNode }) {
  const { status, target, m } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const needsCourse = status === "ready" && !target;
  const signedOut = status === "signedOut";

  useEffect(() => {
    if (signedOut) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (needsCourse) router.replace("/start");
  }, [signedOut, needsCourse, pathname, router]);

  if (status === "unconfigured") return <div className="p-4"><Notice tone="error">{m.common.setupNeeded}</Notice></div>;
  if (status === "error") return <div className="p-4"><Notice tone="error">{m.common.errorGeneric}</Notice></div>;
  if (status === "loading" || signedOut || needsCourse) return <Spinner label={m.common.loading} />;
  return children;
}

export function Logo() {
  return (
    <Link href="/map" aria-label="Bolo home">
      <LogoImage className="h-10" />
    </Link>
  );
}

const STAT = "flex items-center gap-1 rounded-full border-2 border-ink bg-white px-2.5 py-0.5 tabular-nums";

export function TopBar({ streak, children }: { streak?: number; children?: ReactNode }) {
  const { course, m } = useApp();
  return (
    <header className="sticky top-0 z-10 border-b-2 border-ink bg-white/75 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <Logo />
        <div className="flex items-center gap-2 font-display text-base font-semibold sm:gap-3">
          {children}
          {streak !== undefined && (
            <span title={m.done.streak} className={STAT}>
              <span aria-hidden>🔥</span> {streak}
              <span className="sr-only"> {m.done.streak}</span>
            </span>
          )}
          <span title={m.common.points} className={STAT}>
            <span aria-hidden>⭐</span> {course?.points ?? 0}
            <span className="sr-only"> {m.common.points}</span>
          </span>
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}

const TABS = [
  { href: "/map", icon: "🗺️", key: "learn" },
  { href: "/chat", icon: "💬", key: "chat" },
  { href: "/translate", icon: "🌐", key: "translate" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { m } = useApp();
  return (
    <nav aria-label={m.nav.label} className="fixed inset-x-0 bottom-0 z-10 border-t-2 border-ink bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid max-w-md grid-cols-3">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`group flex flex-col items-center gap-0.5 py-1.5 font-display text-sm font-semibold transition-colors ${active ? "text-brand" : "text-muted hover:text-ink"}`}
              >
                <span
                  aria-hidden
                  className={`grid h-8 w-14 place-items-center rounded-full text-2xl transition-[background-color,transform] duration-150 ${active ? "animate-wiggle bg-brand/15" : "group-hover:bg-sun-soft group-active:scale-90"}`}
                >
                  {tab.icon}
                </span>
                {m.nav[tab.key]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** First letter of the learner's name, or of their email. */
export function initialOf(name: string | null, email: string | null): string {
  const source = name?.trim() || email || "?";
  return Array.from(source)[0].toUpperCase();
}

export function Avatar({ className = "size-9 text-lg" }: { className?: string }) {
  const { displayName, email } = useApp();
  return (
    <span aria-hidden className={`grid shrink-0 place-items-center rounded-full border-2 border-ink bg-sun font-display font-bold ${className}`}>
      {initialOf(displayName, email)}
    </span>
  );
}

function AccountMenu() {
  const { displayName, email, signOut, m } = useApp();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-sans text-base font-semibold hover:bg-sun-soft";

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={m.profile.menu}
        className="press grid place-items-center rounded-full"
      >
        <Avatar />
      </button>
      {open && (
        <div id={menuId} className="chunky animate-pop absolute top-full right-0 mt-2 w-64 rounded-2xl bg-white p-2">
          <div className="flex items-center gap-3 border-b-2 border-ink/10 px-2 pt-1 pb-3">
            <Avatar className="size-10 text-xl" />
            <div className="min-w-0">
              {displayName && <p className="truncate font-display text-lg leading-tight">{displayName}</p>}
              <p className="truncate font-sans text-sm font-normal text-muted">{email}</p>
            </div>
          </div>
          <ul className="mt-2 flex flex-col gap-0.5">
            <li>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                aria-current={pathname === "/profile" ? "page" : undefined}
                className={item}
              >
                <span aria-hidden>👤</span> {m.profile.open}
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={() => signOut().catch((error: unknown) => console.error("Sign out failed", error))}
                className={`${item} hover:bg-oops-soft`}
              >
                <span aria-hidden>👋</span> {m.auth.signOut}
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export function SignOutButton({ className = "" }: { className?: string }) {
  const { signOut, m } = useApp();
  return (
    <button
      type="button"
      onClick={() => signOut().catch((error: unknown) => console.error("Sign out failed", error))}
      className={`text-sm font-semibold text-muted underline-offset-4 hover:underline ${className}`}
    >
      {m.auth.signOut}
    </button>
  );
}
