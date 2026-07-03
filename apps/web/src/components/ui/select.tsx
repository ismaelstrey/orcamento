import { forwardRef, type SelectHTMLAttributes } from "react";
import { classNames } from "@/lib/utils/classNames";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

/**
 * Padroniza selects com contraste adequado nos dois temas.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, ...props },
  ref
) {
  return (
    <select
      ref={ref}
      className={classNames(
        "min-h-12 w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-secondary)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition duration-200 focus:border-[var(--accent-strong)] focus:bg-[var(--surface-elevated)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        className
      )}
      {...props}
    />
  );
});
