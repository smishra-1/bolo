import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "yay" | "oops";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  secondary: "bg-white text-ink hover:bg-sun-soft",
  yay: "bg-yay text-white",
  oops: "bg-oops text-white",
};

const BUTTON =
  "chunky press inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 font-display text-lg font-semibold disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function Button({ variant = "primary", className = "", ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button type="button" className={`${BUTTON} ${VARIANTS[variant]} ${className}`} {...props} />;
}

export function ButtonLink({ variant = "primary", className = "", ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${BUTTON} ${VARIANTS[variant]} ${className}`} {...props} />;
}

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`chunky rounded-3xl bg-white ${className}`} {...props} />;
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className="h-4 w-full overflow-hidden rounded-full border-2 border-ink bg-white"
    >
      <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Stars({ count, label, size = "text-base" }: { count: number; label: string; size?: string }) {
  return (
    <span role="img" aria-label={label} className={`${size} tracking-tight`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < count ? "" : "opacity-25 grayscale"} aria-hidden>
          ⭐
        </span>
      ))}
    </span>
  );
}

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "error" }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-2xl border-2 border-ink px-4 py-3 text-center font-semibold ${tone === "error" ? "bg-oops-soft" : "bg-sun-soft"}`}
    >
      {children}
    </div>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <div role="status" className="flex flex-col items-center gap-3 py-12 text-muted">
      <span className="text-5xl motion-safe:animate-bounce" aria-hidden>
        🦜
      </span>
      <span className="font-display text-lg">{label}</span>
    </div>
  );
}

export function Mascot({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={`grid size-11 shrink-0 place-items-center rounded-full border-2 border-ink bg-sun text-2xl ${className}`}>
      🦜
    </span>
  );
}
