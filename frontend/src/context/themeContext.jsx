import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const THEME_STORAGE_KEY = "app_theme_preference";
const VALID_THEMES = ["light", "dark", "system"];

const ThemeContext = createContext(null);


const getSystemTheme = () => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const getStoredTheme = () => {
  if (typeof window === "undefined") return "light";
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return VALID_THEMES.includes(storedTheme) ? storedTheme : "light";
};

const applyThemeToDocument = (theme) => {
  if (typeof document === "undefined") return "light";
  const resolved = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  return resolved;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState(() =>
    applyThemeToDocument(getStoredTheme()),
  );

  useEffect(() => {
    const resolved = applyThemeToDocument(theme);
    setResolvedTheme(resolved);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (theme === "system") {
        setResolvedTheme(applyThemeToDocument("system"));
      }
    };

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [theme]);

  const setThemePreference = (nextTheme) => {
    if (VALID_THEMES.includes(nextTheme)) {
      setTheme(nextTheme);
    }
  };

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setThemePreference,
      themeOptions: VALID_THEMES,
    }),
    [theme, resolvedTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

