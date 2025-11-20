"use client";

import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

export type ThemePreference = "light" | "dark" | "system";

type ThemeState = {
  theme: ThemePreference;
  setTheme: (value: ThemePreference) => void;
};

const memoryStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

const storage = createJSONStorage<Pick<ThemeState, "theme">>(() => {
  if (typeof window === "undefined") {
    return memoryStorage;
  }

  return window.localStorage;
});

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (value) => set({ theme: value }),
    }),
    {
      name: "toki-theme-preference",
      storage,
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);
