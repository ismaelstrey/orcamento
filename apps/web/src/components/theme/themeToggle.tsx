"use client";

import { useTheme } from "@/components/theme/themeProvider";
import { classNames } from "@/lib/utils/classNames";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { isReady, theme, toggleTheme } = useTheme();
  const label = isReady
    ? theme === "dark"
      ? "Alternar para modo claro"
      : "Alternar para modo escuro"
    : "Alternar tema";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={classNames(
        "inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-transparent bg-transparent text-[var(--muted)] transition duration-200 hover:border-[var(--border)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        className
      )}
      aria-label={label}
      title={label}
    >
      {isReady && theme === "dark" ? (
        <svg
          aria-hidden="true"
          className="h-4.5 w-4.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path d="M12 3v2" />
          <path d="M12 19v2" />
          <path d="M4.22 4.22l1.42 1.42" />
          <path d="M18.36 18.36l1.42 1.42" />
          <path d="M3 12h2" />
          <path d="M19 12h2" />
          <path d="M4.22 19.78l1.42-1.42" />
          <path d="M18.36 5.64l1.42-1.42" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          className="h-4.5 w-4.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path d="M20 14.6A8 8 0 0 1 9.4 4 7 7 0 1 0 20 14.6Z" />
        </svg>
      )}
    </button>
  );
}
