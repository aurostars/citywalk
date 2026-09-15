import { Moon, Sun } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useAppState } from "../app/AppState";

type ResolvedTheme = "dark" | "light";

function getSystemTheme(): ResolvedTheme {
  if (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
}

export function ThemeToggle() {
  const {
    state: { theme },
    setTheme,
  } = useAppState();
  const [systemTheme, setSystemTheme] =
    useState<ResolvedTheme>(getSystemTheme);
  const resolvedTheme = theme === "system" ? systemTheme : theme;
  const nextTheme = resolvedTheme === "light" ? "dark" : "light";
  const label = `切换至${nextTheme === "dark" ? "深色" : "浅色"}主题`;

  useEffect(() => {
    if (
      theme !== "system" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }

    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    setSystemTheme(colorScheme.matches ? "dark" : "light");
    colorScheme.addEventListener("change", syncSystemTheme);

    return () => colorScheme.removeEventListener("change", syncSystemTheme);
  }, [theme]);

  useEffect(() => {
    if (theme === "system") {
      delete document.documentElement.dataset.theme;
      return;
    }

    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <button
      aria-label={label}
      className="theme-toggle"
      onClick={() => setTheme(nextTheme)}
      title={label}
      type="button"
    >
      {resolvedTheme === "light" ? (
        <Moon aria-hidden="true" size={19} weight="bold" />
      ) : (
        <Sun aria-hidden="true" size={19} weight="bold" />
      )}
      <span>{nextTheme === "dark" ? "深色" : "浅色"}</span>
    </button>
  );
}
