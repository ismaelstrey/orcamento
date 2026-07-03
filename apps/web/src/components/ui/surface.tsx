import type { ReactNode } from "react";
import { classNames } from "@/lib/utils/classNames";

type SurfaceVariant = "default" | "hero" | "subtle" | "elevated" | "ghost";

interface SurfaceProps {
  as?: "article" | "section" | "div" | "aside" | "header" | "nav";
  variant?: SurfaceVariant;
  className?: string;
  hoverable?: boolean;
  children: ReactNode;
}

const variantClasses: Record<SurfaceVariant, string> = {
  default:
    "border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]",
  hero: "border border-[var(--border-strong)] bg-[var(--surface-hero)] shadow-[var(--shadow-soft)]",
  subtle:
    "border border-[var(--border)] bg-[var(--surface-secondary)] shadow-[var(--shadow-soft)]",
  elevated:
    "border border-[var(--border-strong)] bg-[var(--surface-elevated)] shadow-[var(--shadow-strong)]",
  ghost: "border border-[var(--border)] bg-transparent"
};

/**
 * Centraliza superfícies visuais com borda, fundo e sombra consistentes.
 */
export function Surface({
  as = "div",
  children,
  className,
  hoverable = false,
  variant = "default"
}: SurfaceProps) {
  const Component = as;

  return (
    <Component
      className={classNames(
        "rounded-[1.75rem] p-5 md:p-6",
        variantClasses[variant],
        hoverable &&
          "transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-[var(--surface-elevated)]",
        className
      )}
    >
      {children}
    </Component>
  );
}
