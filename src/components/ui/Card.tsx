import { cn } from "../../utils/cn";
import type { ReactNode } from "react";

export default function Card({
  title,
  subtitle,
  children,
  actions,
  className
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-white/10 bg-black/15 p-4", className)}>
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {subtitle ? <p className="mt-1 text-xs text-[rgb(var(--muted))]">{subtitle}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </header>
      <div className="mt-4">{children}</div>
    </section>
  );
}
