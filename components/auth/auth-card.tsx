"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { useApp } from "../app-provider";

export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-10">
      <p className="text-center font-display text-5xl font-bold text-brand">
        Bolo<span aria-hidden> 🦜</span>
      </p>
      <section className="chunky flex flex-col gap-5 rounded-3xl bg-white p-6">
        <h1 className="text-center font-display text-3xl font-bold">{title}</h1>
        {children}
      </section>
    </main>
  );
}

const INPUT =
  "min-h-12 w-full rounded-2xl border-2 border-ink bg-white px-4 text-lg outline-none focus-visible:ring-3 focus-visible:ring-brand";

export function Field({ label, hint, ...props }: ComponentProps<"input"> & { label: string; hint?: string }) {
  return (
    <label className="flex flex-col gap-1 font-semibold">
      {label}
      <input className={INPUT} {...props} />
      {hint && <span className="text-sm font-normal text-muted">{hint}</span>}
    </label>
  );
}

export function PasswordField({ label, hint, ...props }: ComponentProps<"input"> & { label: string; hint?: string }) {
  const { m } = useApp();
  const [visible, setVisible] = useState(false);
  return (
    <label className="flex flex-col gap-1 font-semibold">
      {label}
      <span className="relative">
        <input className={`${INPUT} pr-14`} type={visible ? "text" : "password"} {...props} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? m.auth.hidePassword : m.auth.showPassword}
          aria-pressed={visible}
          className="absolute inset-y-0 right-2 my-auto grid size-10 place-items-center rounded-full text-xl hover:bg-sun-soft"
        >
          <span aria-hidden>{visible ? "🙈" : "👁️"}</span>
        </button>
      </span>
      {hint && <span className="text-sm font-normal text-muted">{hint}</span>}
    </label>
  );
}
