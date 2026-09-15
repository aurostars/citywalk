import { Moon, Sun } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

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
  const [theme, setTheme] = useState<ResolvedTheme>(getSystemTheme);
  const nextTheme = theme === "light" ? "dark" : "light";
  const label = `切换至${nextTheme === "dark" ? "深色" : "浅色"}主题`;

  useEffect(() => {
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
      {theme === "light" ? (
        <Moon aria-hidden="true" size={19} weight="bold" />
      ) : (
        <Sun aria-hidden="true" size={19} weight="bold" />
      )}
      <span>{nextTheme === "dark" ? "深色" : "浅色"}</span>
    </button>
  );
}
