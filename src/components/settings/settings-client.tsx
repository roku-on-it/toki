"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { DisplayNameCard } from "@/components/settings/display-name-card";
import { ThemePreferenceCard } from "@/components/settings/theme-preference-card";
import { Button } from "@/components/ui/button";
import { SecretKeyGate } from "@/components/user/secret-key-gate";

export function SettingsClient() {
  return (
    <SecretKeyGate>
      {(currentUser) => (
        <main className="flex min-h-screen flex-col bg-background">
          <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
            <header className="flex items-center gap-3">
              <Button
                asChild
                variant="outline"
                size="icon"
                className="rounded-full border border-border/70 bg-transparent"
              >
                <Link href="/">
                  <ArrowLeft className="size-4" />
                  <span className="sr-only">Back to home</span>
                </Link>
              </Button>
              <div className="flex flex-col">
                <h1 className="text-xl font-semibold">Settings</h1>
              </div>
            </header>
            <section className="flex flex-col gap-6 pb-10">
              <DisplayNameCard currentUser={currentUser} />
              <ThemePreferenceCard />
            </section>
          </div>
        </main>
      )}
    </SecretKeyGate>
  );
}
