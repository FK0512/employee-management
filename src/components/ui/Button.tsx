import { cn } from "../../utils/cn";
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
};

export default function Button({ className, variant = "primary", ...props }: ButtonProps) {
  const base =
    "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]/60 disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-gradient-to-r from-[rgb(var(--brand))] to-[rgb(var(--brand2))] text-black hover:opacity-95"
      : variant === "danger"
        ? "bg-[rgb(var(--danger))] text-black hover:opacity-95"
        : "bg-white/0 text-[rgb(var(--text))] hover:bg-white/10 border border-white/10";

  return <button className={cn(base, styles, className)} {...props} />;
}
