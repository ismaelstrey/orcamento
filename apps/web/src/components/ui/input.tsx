import { forwardRef, type InputHTMLAttributes } from "react";
import { classNames } from "@/lib/utils/classNames";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

/**
 * Mantém a aparência e o foco dos campos de texto consistentes em toda a aplicação.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={classNames(
        "min-h-12 w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-secondary)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition duration-200 placeholder:text-[var(--muted)] focus:border-[var(--accent-strong)] focus:bg-[var(--surface-elevated)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        className
      )}
      {...props}
    />
  );
});
