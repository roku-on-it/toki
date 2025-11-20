"use client";

import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { Moon, MonitorSmartphone, SunMedium } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemePreference, useThemeStore } from "@/lib/stores/theme-store";
import { cn } from "@/lib/utils";

type ThemeOption = {
  value: ThemePreference;
  label: string;
  helper: string;
  icon: LucideIcon;
};

const THEME_OPTIONS: ThemeOption[] = [
  {
    value: "system",
    label: "Match device",
    helper: "Automatically follows iOS or Android setting",
    icon: MonitorSmartphone,
  },
  {
    value: "light",
    label: "Light",
    helper: "Bright background, high contrast",
    icon: SunMedium,
  },
  {
    value: "dark",
    label: "Dark",
    helper: "Low-light friendly, battery saver",
    icon: Moon,
  },
];

export function ThemePreferenceCard() {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  const activeOption = useMemo(
    () => THEME_OPTIONS.find((option) => option.value === theme) ?? THEME_OPTIONS[0],
    [theme],
  );

  return (
    <Card className="rounded-3xl border border-border/70 shadow-none">
      <CardHeader className="space-y-2">
        <CardTitle className="text-lg">Theme</CardTitle>
        </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="theme-select" className="text-sm text-muted-foreground">
            Appearance
          </Label>
          <Select
            value={theme}
            onValueChange={(value) => setTheme(value as ThemePreference)}
          >
            <SelectTrigger id="theme-select" className="w-full justify-between">
              <SelectValue placeholder="Choose how Toki should look" />
            </SelectTrigger>
            <SelectContent align="start">
              {THEME_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex items-center gap-2">
                    <option.icon className="size-4" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {activeOption.helper}
          </p>
        </div>
        <ThemePreview theme={theme} />
      </CardContent>
    </Card>
  );
}

function ThemePreview({ theme }: { theme: ThemePreference }) {
  if (theme === "system") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <PreviewCard theme="light" label="Light" />
        <PreviewCard theme="dark" label="Dark" />
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <PreviewCard theme={theme} label={theme === "dark" ? "Dark" : "Light"} />
    </div>
  );
}

function PreviewCard({
  theme,
  label,
}: {
  theme: Exclude<ThemePreference, "system">;
  label: string;
}) {
  const palette =
    theme === "dark"
      ? {
          container: "bg-zinc-900 text-zinc-50 border border-zinc-700",
          chip: "bg-zinc-800",
          subtile: "bg-zinc-700",
          badge: "bg-white/10 text-white",
        }
      : {
          container: "bg-white text-zinc-900 border border-zinc-200",
          chip: "bg-zinc-100",
          subtile: "bg-zinc-200",
          badge: "bg-zinc-900/5 text-zinc-900",
        };

  return (
    <div
      className={cn(
        "flex flex-1 flex-col gap-3 rounded-2xl p-4 text-sm transition-colors",
        palette.container,
      )}
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-wide opacity-70">
        <span>{label} preview</span>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", palette.badge)}>
          {theme === "dark" ? "OLED" : "Daylight"}
        </span>
      </div>
      <div className={cn("h-2 rounded-full", palette.subtile)} />
      <div className="space-y-2">
        <div className={cn("h-10 w-full rounded-xl", palette.chip)} />
        <div className="grid grid-cols-3 gap-2">
          <div className={cn("h-6 rounded-lg", palette.chip)} />
          <div className={cn("h-6 rounded-lg", palette.chip)} />
          <div className={cn("h-6 rounded-lg", palette.chip)} />
        </div>
      </div>
    </div>
  );
}
