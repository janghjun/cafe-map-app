import { useState, useEffect } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "kagong_theme";

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
    const favicon = document.querySelector<HTMLLinkElement>("#app-favicon");
    if (favicon) {
      favicon.href = theme === "dark" ? "/cafe_app_light_logo.png" : "/cafe_app_dark_logo.png";
    }
  }, [theme]);

  function toggle() {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  return [theme, toggle];
}
