"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { Heart, Loader2, Send, Settings } from "lucide-react";
import { io, type Socket } from "socket.io-client";
import confetti from "canvas-confetti";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CurrentUserProfile, type PresenceUser } from "@/lib/types/user";
import type { ChatMessagePayload } from "@/lib/types/chat";

const accentPalette = [
  "bg-indigo-500",
  "bg-amber-500",
  "bg-pink-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-purple-500",
  "bg-rose-500",
];

const initialsFromName = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const accentFromId = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % accentPalette.length;
  return accentPalette[index];
};

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const heartEmojis = ["❤️", "💖", "💕", "💗", "💓", "💝", "💘", "💞"];

const triggerHeartConfetti = () => {
  const count = 15;
  const defaults = {
    spread: 80,
    ticks: 100,
    gravity: 0.8,
    decay: 0.94,
    startVelocity: 15,
    scalar: 2,
    flat: true,
  };

  const shapes = heartEmojis.map((emoji) => confetti.shapeFromText({ text: emoji, scalar: 2 }));

  // Fire from bottom-left
  confetti({
    ...defaults,
    particleCount: count,
    origin: { x: 0.3, y: 1 },
    angle: 70,
    shapes,
  });

  // Fire from bottom-right
  confetti({
    ...defaults,
    particleCount: count,
    origin: { x: 0.7, y: 1 },
    angle: 110,
    shapes,
  });
};

type Participant = {
  id: string;
  name: string;
  initials: string;
  accent: string;
  avatar?: string | null;
};

export function ChatShell({
  className,
  currentUser,
}: {
  className?: string;
  currentUser: CurrentUserProfile;
}) {
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>(() => [
    {
      id: currentUser.id,
      displayName: currentUser.displayName,
      avatarBase64: currentUser.avatarBase64 ?? null,
    },
  ]);
  const [messages, setMessages] = useState<ChatMessagePayload[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [composerValue, setComposerValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Map<string, { displayName: string; text: string; avatarBase64: string | null }>>(new Map());

  const socketRef = useRef<Socket | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const autoScrollRef = useRef(true);

  useEffect(() => {
    setPresenceUsers([
      {
        id: currentUser.id,
        displayName: currentUser.displayName,
        avatarBase64: currentUser.avatarBase64 ?? null,
      },
    ]);
  }, [currentUser.id, currentUser.displayName, currentUser.avatarBase64]);

  const handleIncomingMessage = useCallback((incoming: ChatMessagePayload) => {
    autoScrollRef.current = true;
    setMessages((prev) => {
      if (prev.some((existing) => existing.id === incoming.id)) {
        return prev;
      }
      return [...prev, incoming];
    });
  }, []);

  useEffect(() => {
    let active = true;

    const setupSocket = async () => {
      try {
        await fetch("/api/socket");
      } catch (error) {
        console.error("Failed to warm socket endpoint", error);
      }

      if (!active) return;

      const socket = io({ path: "/api/socket/io" });
      socketRef.current = socket;

      socket.on("connect", () => {
        socket.emit("user:join", {
          id: currentUser.id,
          displayName: currentUser.displayName,
          avatarBase64: currentUser.avatarBase64 ?? null,
        });
      });

      socket.on("presence:update", (users: PresenceUser[]) => {
        setPresenceUsers(users);
      });

      socket.on("message:new", handleIncomingMessage);

      socket.on("heart:confetti", () => {
        triggerHeartConfetti();
      });

      socket.on("typing:update", (payload: { userId: string; displayName: string; text: string; avatarBase64: string | null }) => {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.set(payload.userId, {
            displayName: payload.displayName,
            text: payload.text,
            avatarBase64: payload.avatarBase64,
          });
          return next;
        });
      });

      socket.on("typing:stop", (payload: { userId: string }) => {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.delete(payload.userId);
          return next;
        });
      });

      socket.on(
        "user:updated",
        (payload: { id: string; displayName: string; avatarBase64: string | null }) => {
          setPresenceUsers((prev) =>
            prev.map((user) =>
              user.id === payload.id
                ? { ...user, displayName: payload.displayName, avatarBase64: payload.avatarBase64 }
                : user,
            ),
          );

          setMessages((prev) =>
            prev.map((message) =>
              message.author.id === payload.id
                ? {
                    ...message,
                    author: {
                      ...message.author,
                      displayName: payload.displayName,
                      avatarBase64: payload.avatarBase64,
                    },
                  }
                : message,
            ),
          );
        },
      );
    };

    void setupSocket();

    return () => {
      active = false;
      socketRef.current?.off("message:new", handleIncomingMessage);
      socketRef.current?.off("user:updated");
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [currentUser.id, currentUser.displayName, currentUser.avatarBase64, handleIncomingMessage]);

  useEffect(() => {
    if (!socketRef.current || !socketRef.current.connected) return;
    socketRef.current.emit("user:join", {
      id: currentUser.id,
      displayName: currentUser.displayName,
      avatarBase64: currentUser.avatarBase64 ?? null,
    });
  }, [currentUser.displayName, currentUser.avatarBase64, currentUser.id]);

  const fetchMessages = useCallback(
    async (cursor?: number) => {
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor.toString());
      const queryString = params.toString();
      const response = await fetch(`/api/messages${queryString ? `?${queryString}` : ""}`, {
        headers: {
          "x-secret-key": currentUser.secretKey,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load messages");
      }

      const data = (await response.json()) as {
        messages: ChatMessagePayload[];
        nextCursor: number | null;
      };

      setMessages((prev) => (cursor ? [...data.messages, ...prev] : data.messages));
      autoScrollRef.current = !cursor;
      setNextCursor(data.nextCursor);
    },
    [currentUser.secretKey],
  );

  useEffect(() => {
    setMessagesLoading(true);
    fetchMessages()
      .catch((error) => {
        console.error(error);
        setMessageError("Unable to load messages.");
      })
      .finally(() => setMessagesLoading(false));
  }, [fetchMessages]);

  useEffect(() => {
    if (!autoScrollRef.current) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    autoScrollRef.current = false;
  }, [messages.length]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [typingUsers]);

  const presenceParticipants = useMemo(() => {
    const source = presenceUsers.length
      ? presenceUsers
      : [
          {
            id: currentUser.id,
            displayName: currentUser.displayName,
            avatarBase64: currentUser.avatarBase64 ?? null,
          },
        ];

    const sorted = [...source].sort((a, b) => {
      if (a.id === currentUser.id) return -1;
      if (b.id === currentUser.id) return 1;
      return a.displayName.localeCompare(b.displayName);
    });

    return sorted.map((user) => ({
      id: user.id,
      name: user.displayName,
      initials: initialsFromName(user.displayName),
      accent: user.id === currentUser.id ? "bg-indigo-500" : accentFromId(user.id),
      avatar: user.avatarBase64,
    }));
  }, [presenceUsers, currentUser.id, currentUser.displayName, currentUser.avatarBase64]);

  const activeMembers = presenceParticipants.slice(0, 3);
  const extraCount = Math.max(presenceParticipants.length - activeMembers.length, 0);

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    const container = scrollContainerRef.current;
    const previousHeight = container?.scrollHeight ?? 0;
    const previousTop = container?.scrollTop ?? 0;
    setIsLoadingMore(true);
    autoScrollRef.current = false;
    try {
      await fetchMessages(nextCursor);
      requestAnimationFrame(() => {
        const target = scrollContainerRef.current;
        if (!target) return;
        const newHeight = target.scrollHeight;
        const delta = newHeight - previousHeight;
        target.scrollTop = previousTop + delta;
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleComposerChange = (value: string) => {
    setComposerValue(value);

    if (value.trim()) {
      // Emit typing update
      socketRef.current?.emit("typing:update", {
        userId: currentUser.id,
        displayName: currentUser.displayName,
        text: value,
        avatarBase64: currentUser.avatarBase64 ?? null,
      });
    } else {
      // Empty input, stop typing immediately
      socketRef.current?.emit("typing:stop", { userId: currentUser.id });
    }
  };

  const handleSend = async () => {
    const trimmed = composerValue.trim();
    if (!trimmed || isSending) return;
    setIsSending(true);
    setMessageError(null);

    // Stop typing indicator
    socketRef.current?.emit("typing:stop", { userId: currentUser.id });

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-secret-key": currentUser.secretKey,
        },
        body: JSON.stringify({ body: trimmed }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to send message");
      }

      const newMessage = (await response.json()) as ChatMessagePayload;
      autoScrollRef.current = true;
      setMessages((prev) => {
        if (prev.some((msg) => msg.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
      setComposerValue("");
    } catch (error) {
      setMessageError(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className={cn("relative flex h-full flex-col bg-white/95 dark:bg-zinc-950", className)}>
      <div className="fixed left-0 right-0 top-0 z-20 border-b border-border/60 bg-white/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:bg-zinc-900/95">
        <div className="flex w-full items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Connected
            </span>
            <span className="text-sm font-semibold text-foreground">Toki crew</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full border-border/60 text-muted-foreground"
              onClick={() => socketRef.current?.emit("heart:confetti")}
            >
              <Heart className="size-4" />
              <span className="sr-only">Send hearts</span>
            </Button>
            <Button
              asChild
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full border-border/60 text-muted-foreground"
            >
              <Link href="/settings">
                <Settings className="size-4" />
                <span className="sr-only">Open settings</span>
              </Link>
            </Button>
            <div className="flex -space-x-3">
              {activeMembers.map((member) => (
                <Avatar
                  key={member.id}
                  className={cn(
                    "size-10 border-2 border-background text-xs",
                    member.accent,
                    "text-white",
                  )}
                >
                  {member.avatar ? <AvatarImage src={member.avatar} alt={member.name} /> : null}
                  <AvatarFallback className="uppercase tracking-wide">
                    {member.initials}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            {extraCount > 0 ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-background text-[11px] font-medium text-muted-foreground">
                +{extraCount}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex h-full w-full flex-1 flex-col gap-3 px-6 pb-5 pt-24">
        <div className="min-h-0 flex-1">
          <div ref={scrollContainerRef} className="h-full w-full overflow-y-auto pr-3">
            <div className="space-y-2">
              {nextCursor ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? "Loading..." : "Load previous messages"}
                </Button>
              ) : null}
              {messagesLoading ? (
                <div className="flex justify-center py-10 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 size-4 animate-spin" /> Loading conversation...
                </div>
              ) : null}
              {!messagesLoading && !hasMessages ? (
                <p className="text-center text-sm text-muted-foreground">
                  No messages yet. Say hello!
                </p>
              ) : null}
              {messages.map((message, index) => {
                const previous = messages[index - 1];
                const showMeta = !previous || previous.author.id !== message.author.id;
                return (
                  <MessageItem
                    key={message.id}
                    message={message}
                    showMeta={showMeta}
                    isOwn={message.author.id === currentUser.id}
                  />
                );
              })}
              {Array.from(typingUsers.entries()).map(([userId, { displayName, text, avatarBase64 }]) => (
                <div key={userId} className="flex items-start gap-3 opacity-70">
                  <Avatar className="size-9">
                    {avatarBase64 ? (
                      <AvatarImage src={avatarBase64} alt={displayName} />
                    ) : null}
                    <AvatarFallback className="uppercase text-xs">
                      {initialsFromName(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-2 text-sm">
                      <span className="font-semibold text-foreground">{displayName}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words">
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Separator />
        {messageError ? (
          <p className="text-xs text-destructive">{messageError}</p>
        ) : null}
        <Composer
          value={composerValue}
          onChange={handleComposerChange}
          onSend={handleSend}
          isSending={isSending}
        />
      </div>
    </div>
  );
}

type MessageItemProps = {
  message: ChatMessagePayload;
  isOwn: boolean;
  showMeta: boolean;
};

function MessageItem({ message, isOwn, showMeta }: MessageItemProps) {
  const avatar = (
    <Avatar className="size-9">
      {message.author.avatarBase64 ? (
        <AvatarImage src={message.author.avatarBase64} alt={message.author.displayName} />
      ) : null}
      <AvatarFallback className="uppercase text-xs">
        {initialsFromName(message.author.displayName)}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <div className="flex items-start gap-3">
      {showMeta ? avatar : <div className="w-9" />}
      <div className="flex flex-col gap-1">
        {showMeta ? (
          <div className="flex items-baseline gap-2 text-sm">
            <span className="font-semibold text-foreground">{message.author.displayName}</span>
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {formatTime(message.sentAt)}
            </span>
          </div>
        ) : null}
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words">
          {message.body}
        </p>
      </div>
    </div>
  );
}

type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isSending: boolean;
};

function Composer({ value, onChange, onSend, isSending }: ComposerProps) {
  const disabled = isSending || value.trim().length === 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-3 px-1">
        <Textarea
          rows={2}
          placeholder="Type a message..."
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (!disabled) onSend();
            }
          }}
          className="min-h-[58px] w-full resize-none border-0 bg-transparent px-0 pb-0 text-base shadow-none focus-visible:ring-0 focus-visible:outline-none"
        />
        <Button size="icon" className="rounded-2xl shadow-none" disabled={disabled} onClick={onSend}>
          {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </div>
  );
}
