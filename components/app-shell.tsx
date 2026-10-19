"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useApp } from "./app-provider";
import { Notice, Spinner } from "./ui";

/** Sends signed-out visitors to /login and shows a loading state until a language is picked. */
export function CourseGate({ children }: { children: ReactNode }) {
  const { status, target, m } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const needsCourse = status === "ready" && !target;
  const signedOut = status === "signedOut";

  useEffect(() => {
    if (signedOut) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (needsCourse) router.replace("/");
  }, [signedOut, needsCourse, pathname, router]);

  if (status === "unconfigured") return <div className="p-4"><Notice tone="error">{m.common.setupNeeded}</Notice></div>;
  if (status === "error") return <div className="p-4"><Notice tone="error">{m.common.errorGeneric}</Notice></div>;
  if (status === "loading" || signedOut || needsCourse) return <Spinner label={m.common.loading} />;
  return children;
}

export function Logo() {
  return (
    <Link href="/map" className="font-display text-2xl font-bold text-brand">
      Bolo<span aria-hidden>🦜</span>
    </Link>
  );
}

export function TopBar({ streak, children }: { streak?: number; children?: ReactNode }) {
  const { course, m } = useApp();
  return (
    <header className="sticky top-0 z-10 border-b-2 border-ink bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <Logo />
        <div className="flex items-center gap-4 font-display text-lg font-semibold">
          {children}
          {streak !== undefined && (
            <span title={m.done.streak}>
              <span aria-hidden>🔥</span> {streak}
              <span className="sr-only"> {m.done.streak}</span>
            </span>
          )}
          <span title={m.common.points}>
            <span aria-hidden>⭐</span> {course?.points ?? 0}
            <span className="sr-only"> {m.common.points}</span>
          </span>
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
                className={`flex flex-col items-center py-2 font-display text-sm font-semibold ${active ? "text-brand" : "text-muted"}`}
              >
                <span aria-hidden className="text-2xl">{tab.icon}</span>
                {m.nav[tab.key]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
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
