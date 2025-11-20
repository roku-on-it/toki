"use client";

import { FormEvent, ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrentUserProfile } from "@/lib/types/user";

const STORAGE_KEY = "toki-secret-key";

type GateState = "checking" | "prompt" | "ready";

// Helper to check localStorage synchronously before first render
function getInitialSavedKey(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

type SecretKeyGateProps = {
  children: (user: CurrentUserProfile) => ReactNode;
};

type SecretKeyContextValue = {
  user: CurrentUserProfile;
  refresh: () => Promise<void>;
};

const SecretKeyContext = createContext<SecretKeyContextValue | null>(null);

export function useSecretKeyUser() {
  const context = useContext(SecretKeyContext);
  if (!context) {
    throw new Error("useSecretKeyUser must be used within SecretKeyGate");
  }
  return context;
}

export function SecretKeyGate({ children }: SecretKeyGateProps) {
  // Check localStorage synchronously to determine initial state
  const initialSavedKey = getInitialSavedKey();
  const initialGateState: GateState = initialSavedKey ? "checking" : "prompt";
  const initialDialogOpen = !initialSavedKey;

  const [gateState, setGateState] = useState<GateState>(initialGateState);
  const [dialogOpen, setDialogOpen] = useState(initialDialogOpen);
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<CurrentUserProfile | null>(null);

  // Only force dialog open when prompting for key or on error, not while checking
  const isDialogForcedOpen = gateState === "prompt";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedKey = window.localStorage.getItem(STORAGE_KEY);

    // Only verify if we have a saved key (initial state already handles the no-key case)
    if (savedKey) {
      void verifySecretKey(savedKey, { shouldPersist: false });
    }
  }, []);

  const verifySecretKey = async (
    secretKey: string,
    { shouldPersist = true }: { shouldPersist?: boolean } = {},
  ) => {
    if (!secretKey) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/users/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ secretKey }),
      });

      if (!response.ok) {
        throw new Error(response.status === 404 ? "Unknown secret key" : "Server error");
      }

      const profile = (await response.json()) as CurrentUserProfile;
      setUser(profile);
      if (shouldPersist && typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, profile.secretKey);
      }
      setGateState("ready");
      setDialogOpen(false);
      setInput("");
      setError(null);
    } catch (err) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(STORAGE_KEY);
      }
      setUser(null);
      setGateState("prompt");
      setDialogOpen(true);
      setError(
        err instanceof Error ? err.message : "We couldn't verify that secret key. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim()) {
      setError("Secret key is required");
      return;
    }
    void verifySecretKey(input.trim());
  };

  const canRenderChildren = useMemo(() => gateState === "ready" && !!user, [gateState, user]);

  const refresh = async () => {
    if (!user) return;
    await verifySecretKey(user.secretKey, { shouldPersist: true });
  };

  useEffect(() => {
    if (!user) return;
    let active = true;
    let socket: Socket | null = null;

    const setupSocket = async () => {
      try {
        await fetch("/api/socket");
      } catch (error) {
        console.error("Failed to seed socket for gate", error);
      }

      if (!active) return;

      socket = io({ path: "/api/socket/io" });

      socket.on("connect", () => {
        socket?.emit("user:join", {
          id: user.id,
          displayName: user.displayName,
          avatarBase64: user.avatarBase64 ?? null,
        });
      });

      socket.on("user:updated", (payload: { id: string; displayName: string; avatarBase64: string | null }) => {
        if (payload.id !== user.id) return;
        setUser((prev) =>
          prev
            ? {
                ...prev,
                displayName: payload.displayName,
                avatarBase64: payload.avatarBase64 ?? prev.avatarBase64,
              }
            : prev,
        );
      });
    };

    void setupSocket();

    return () => {
      active = false;
      socket?.disconnect();
    };
  }, [user?.id, user?.displayName, user?.avatarBase64]);

  return (
    <>
      {canRenderChildren ? (
        <SecretKeyContext.Provider value={{ user: user as CurrentUserProfile, refresh }}>
          {children(user as CurrentUserProfile)}
        </SecretKeyContext.Provider>
      ) : (
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            <span>Loading your workspace...</span>
          </div>
        </div>
      )}

      <Dialog
        open={isDialogForcedOpen || dialogOpen}
        onOpenChange={(nextOpen) => {
          if (isDialogForcedOpen) return;
          setDialogOpen(nextOpen);
        }}
      >
        <DialogContent className="w-full max-w-sm" showCloseButton={false}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Enter your secret key</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="secret-key">Secret key</Label>
              <Input
                id="secret-key"
                value={input}
                onChange={(event) => {
                  setError(null);
                  setInput(event.target.value.slice(0, 32));
                }}
                maxLength={32}
                placeholder="Paste your 32-character key"
                autoComplete="off"
                autoFocus
                disabled={isSubmitting}
              />
              {error ? <p className="text-xs text-destructive">{error}</p> : null}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Checking...
                  </span>
                ) : (
                  "Continue"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
