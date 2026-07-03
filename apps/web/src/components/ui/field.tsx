import type { ReactNode } from "react";
import { classNames } from "@/lib/utils/classNames";

interface FieldProps {
  label: string;
  htmlFor?: string;
  description?: string;
  error?: string | null;
  className?: string;
  children: ReactNode;
}

/**
 * Agrupa rótulo, descrição e conteúdo de campos para reduzir repetição visual.
 */
export function Field({
  children,
  className,
  description,
  error,
  htmlFor,
  label
}: FieldProps) {
  return (
    <label className={classNames("grid gap-2.5 text-sm", className)} htmlFor={htmlFor}>
      <span className="font-medium text-[var(--foreground)]">{label}</span>
      {description ? (
        <span className="text-xs leading-6 text-[var(--muted)]">{description}</span>
      ) : null}
      {children}
      {error ? (
        <span className="text-xs leading-5 text-[color:rgb(251,113,133)]">{error}</span>
      ) : null}
    </label>
  );
}
