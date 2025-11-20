"use client";

import { ChatShell } from "@/components/chat/chat-shell";
import { SecretKeyGate } from "@/components/user/secret-key-gate";

export function HomeClient() {
  return (
    <SecretKeyGate>
      {(currentUser) => (
        <main className="relative flex h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-indigo-950/40">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.25),_transparent_55%)]" />
          <div className="relative z-10 flex h-full w-full">
            <ChatShell currentUser={currentUser} className="h-full w-full" />
          </div>
        </main>
      )}
    </SecretKeyGate>
  );
}
