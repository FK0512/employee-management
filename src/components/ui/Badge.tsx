import { cn } from "../../utils/cn";
import type { ReactNode } from "react";

export default function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-[rgb(var(--muted))]",
        className
      )}
    >
      {children}
    </span>
  );
}
