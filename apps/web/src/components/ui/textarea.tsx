import { forwardRef, type TextareaHTMLAttributes } from "react";
import { classNames } from "@/lib/utils/classNames";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * Mantém áreas de texto com altura mínima e espaçamento previsível.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={classNames(
          "min-h-28 w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-secondary)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition duration-200 placeholder:text-[var(--muted)] focus:border-[var(--accent-strong)] focus:bg-[var(--surface-elevated)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
          className
        )}
        {...props}
      />
    );
  }
);
