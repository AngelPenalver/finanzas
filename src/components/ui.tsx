import { type ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-lg ${className}`}
    >
      {children}
    </section>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-400">
      {children}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 ${props.className ?? ""}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500 ${props.className ?? ""}`}
    />
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
}) {
  const variants = {
    primary:
      "bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50",
    ghost:
      "border border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800",
    danger: "bg-red-900/40 text-red-300 hover:bg-red-900/60",
  };
  return (
    <button
      {...props}
      className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-emerald-600 text-white"
          : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}
