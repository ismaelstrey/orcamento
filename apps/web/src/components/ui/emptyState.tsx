import type { ReactNode } from "react";
import { classNames } from "@/lib/utils/classNames";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Padroniza estados vazios para evitar blocos sem hierarquia ou orientação ao usuário.
 */
export function EmptyState({
  action,
  className,
  description,
  title
}: EmptyStateProps) {
  return (
    <div
      className={classNames(
        "rounded-[1.6rem] border border-dashed border-[var(--border-strong)] bg-[var(--surface-secondary)] p-6 text-left",
        className
      )}
    >
      <p className="text-lg font-semibold text-[var(--foreground-strong)]">{title}</p>
      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
