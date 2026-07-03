import type { ReactNode } from "react";
import { classNames } from "@/lib/utils/classNames";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  summary?: ReactNode;
  className?: string;
}

/**
 * Organiza o topo das páginas com hierarquia visual e área de ações flexível.
 */
export function PageHeader({
  actions,
  className,
  description,
  eyebrow,
  summary,
  title
}: PageHeaderProps) {
  return (
    <header
      className={classNames(
        "grid gap-5 rounded-[2rem] border border-[var(--border)] bg-[var(--surface-hero)] p-6 shadow-[var(--shadow-soft)] xl:grid-cols-[minmax(0,1fr)_auto]",
        className
      )}
    >
      <div className="max-w-4xl">
        <span className="inline-flex rounded-full border border-[var(--border-strong)] bg-[var(--surface-secondary)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--accent-strong)]">
          {eyebrow}
        </span>
        <h1 className="mt-4 text-3xl leading-tight font-semibold tracking-tight text-[var(--foreground-strong)] md:text-4xl xl:text-[2.7rem]">
          {title}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)] md:text-base">
          {description}
        </p>
        {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
      </div>

      {summary ? (
        <div className="min-w-0 max-w-full xl:w-[21rem]">{summary}</div>
      ) : null}
    </header>
  );
}
