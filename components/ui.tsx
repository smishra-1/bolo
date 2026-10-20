import Link from "next/link";
import type { ComponentProps, CSSProperties, ReactNode } from "react";

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
      <div
        className="h-full rounded-full bg-brand shadow-[inset_0_-3px_0_0_rgb(0_0_0/0.15)] transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Stars({ count, label, size = "text-base" }: { count: number; label: string; size?: string }) {
  return (
    <span role="img" aria-label={label} className={`${size} tracking-tight`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`inline-block ${i < count ? "animate-star" : "opacity-25 grayscale"}`}
          style={i < count ? { animationDelay: `${200 + i * 120}ms` } : undefined}
          aria-hidden
        >
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
    <div role="status" className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 py-12 text-muted">
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

/** Small round button for icon-only actions such as "listen" or "translate". */
export function IconButton({ className = "", ...props }: ComponentProps<"button"> & { "aria-label": string }) {
  return (
    <button
      type="button"
      className={`press grid size-10 shrink-0 place-items-center rounded-full border-2 border-ink bg-white text-lg shadow-chunky-sm hover:bg-sun-soft aria-pressed:bg-sun ${className}`}
      {...props}
    />
  );
}

const CONFETTI_COLORS = ["#f59e0b", "#ec4899", "#22c55e", "#3b82f6", "#8b5cf6", "#f97316"];

/** A one-off burst of confetti from the centre of its (relative) parent. */
export function Confetti({ pieces = 24 }: { pieces?: number }) {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-visible">
      {Array.from({ length: pieces }, (_, i) => {
        // Spread evenly around a circle, with a fixed wobble so renders match.
        const angle = (i / pieces) * Math.PI * 2 + (i % 3) * 0.2;
        const distance = 90 + ((i * 37) % 70);
        const style = {
          "--x": `${Math.cos(angle) * distance}px`,
          "--y": `${Math.sin(angle) * distance + 40}px`,
          "--r": `${(i % 2 ? 1 : -1) * (180 + i * 20)}deg`,
          background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          animationDelay: `${(i % 4) * 30}ms`,
        } as CSSProperties;
        return <span key={i} className={`absolute top-1/2 left-1/2 animate-confetti ${i % 3 ? "h-2 w-3 rounded-sm" : "size-2.5 rounded-full"}`} style={style} />;
      })}
    </span>
  );
}
