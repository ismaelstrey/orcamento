"use client";

import { useTheme } from "@/components/theme/themeProvider";
import { classNames } from "@/lib/utils/classNames";

interface ThemeToggleProps {
  className?: string;
}

/**
 * Alterna entre os temas claros e escuros sem sair do contexto atual da tela.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { isReady, theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={classNames(
        "inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface-secondary)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--surface-elevated)]",
        className
      )}
      aria-label="Alternar tema"
    >
      <span className="text-base leading-none">
        {isReady ? (theme === "dark" ? "☾" : "☀") : "◐"}
      </span>
      <span>{isReady ? (theme === "dark" ? "Modo escuro" : "Modo claro") : "Tema"}</span>
    </button>
  );
}
