"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { classNames } from "@/lib/utils/classNames";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-[color:rgba(59,130,246,0.35)] bg-[linear-gradient(135deg,rgba(56,189,248,0.22),rgba(99,102,241,0.24))] text-[var(--foreground-strong)] shadow-[0_14px_34px_rgba(37,99,235,0.18)] hover:border-[color:rgba(59,130,246,0.5)] hover:bg-[linear-gradient(135deg,rgba(56,189,248,0.3),rgba(99,102,241,0.28))]",
  secondary:
    "border border-[var(--border-strong)] bg-[var(--surface-secondary)] text-[var(--foreground)] hover:bg-[var(--surface-elevated)]",
  ghost:
    "border border-transparent bg-transparent text-[var(--foreground)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-secondary)]",
  danger:
    "border border-[color:rgba(244,63,94,0.26)] bg-[color:rgba(244,63,94,0.12)] text-[color:rgb(255,228,230)] hover:bg-[color:rgba(244,63,94,0.18)]"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3.5 py-2 text-sm",
  md: "px-4.5 py-2.5 text-sm",
  lg: "px-5 py-3 text-base"
};

/**
 * Padroniza botões com contraste consistente e microinterações leves.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    className,
    disabled,
    fullWidth = false,
    size = "md",
    type = "button",
    variant = "primary",
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={classNames(
        "inline-flex items-center justify-center rounded-full font-medium transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0",
        fullWidth && "w-full",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
