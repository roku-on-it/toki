"use client";

import { useEffect } from "react";

import { useThemeStore } from "@/lib/stores/theme-store";

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const resolveTheme = () =>
      theme === "system" ? (mediaQuery.matches ? "dark" : "light") : theme;

    const applyTheme = () => {
      const nextTheme = resolveTheme();
      root.classList.remove("light", "dark");
      root.classList.add(nextTheme);
      root.dataset.theme = nextTheme;
      root.style.colorScheme = nextTheme;
    };

    applyTheme();

    let cleanup: (() => void) | undefined;

    if (theme === "system") {
      mediaQuery.addEventListener("change", applyTheme);
      cleanup = () => mediaQuery.removeEventListener("change", applyTheme);
    }

    return () => {
      cleanup?.();
    };
  }, [theme]);

  return <>{children}</>;
}
