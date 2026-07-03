"use client";

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (nextTheme: ThemeMode) => void;
  toggleTheme: () => void;
  isReady: boolean;
}

const storageKey = "orcamento-theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveInitialTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "dark";
  }

  const documentTheme = document.documentElement.dataset.theme;

  if (documentTheme === "light" || documentTheme === "dark") {
    return documentTheme;
  }

  const storedTheme = window.localStorage.getItem(storageKey);

  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Sincroniza o tema visual com o documento para permitir alternância entre claro e escuro.
 */
export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setThemeState] = useState<ThemeMode>(() => resolveInitialTheme());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(storageKey, theme);
  }, [theme]);

  useEffect(() => {
    const readyTimeout = window.setTimeout(() => {
      setIsReady(true);
    }, 0);

    return () => {
      window.clearTimeout(readyTimeout);
    };
  }, []);

  const setTheme = useCallback((nextTheme: ThemeMode): void => {
    setThemeState(nextTheme);
  }, []);

  const toggleTheme = useCallback((): void => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const contextValue = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      isReady
    }),
    [isReady, setTheme, theme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const themeContext = useContext(ThemeContext);

  if (!themeContext) {
    throw new Error("useTheme deve ser usado dentro de ThemeProvider.");
  }

  return themeContext;
}
