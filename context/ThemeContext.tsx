"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggleTheme: () => {},
});

const STORAGE_KEY = "artbydani7-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === "light" || stored === "dark") return stored;
    // Default to light regardless of OS preference
    return "light";
  } catch {
    return "light";
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Start from the SSR default so the first client render matches the server
  // HTML exactly — this prevents hydration mismatches in theme-dependent UI
  // (e.g. the nav toggle icon). There is NO visual flash: the inline script in
  // _document.tsx has already set <html data-theme> to the stored value before
  // first paint. We reconcile React state to that stored value right after mount.
  const [theme, setTheme] = useState<Theme>("light");
  const [hydrated, setHydrated] = useState(false);

  // After hydration, adopt the persisted theme (post-hydration update, safe).
  useEffect(() => {
    setTheme(getInitialTheme());
    setHydrated(true);
  }, []);

  // Sync to <html data-theme="..."> and localStorage. Skip the first run so we
  // don't clobber the attribute the bootstrap script set before reconciliation.
  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
  }, [theme, hydrated]);

  const toggleTheme = () =>
    setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
