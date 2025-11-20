import type { NextApiRequest, NextApiResponse } from "next";

import { getSocketServer } from "@/lib/socket-server";
import type { PresenceUser } from "@/lib/types/user";

const connectedUsers = new Map<string, PresenceUser>();
let presenceInitialized = false;

function emitPresence(io: ReturnType<typeof getSocketServer>) {
  if (!io) return;
  const uniqueUsers = Array.from(
    new Map(Array.from(connectedUsers.values()).map((user) => [user.id, user])).values(),
  );
  io.emit("presence:update", uniqueUsers);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const io = getSocketServer(res.socket.server);

  if (io && !presenceInitialized) {
    presenceInitialized = true;
    io.on("connection", (socket) => {
      socket.on("user:join", (user: PresenceUser) => {
        connectedUsers.set(socket.id, user);
        emitPresence(io);
      });

      socket.on("disconnect", () => {
        connectedUsers.delete(socket.id);
        emitPresence(io);
      });

      socket.on("heart:confetti", () => {
        io.emit("heart:confetti");
      });

      socket.on("typing:update", (payload: { userId: string; displayName: string; text: string; avatarBase64: string | null }) => {
        socket.broadcast.emit("typing:update", payload);
      });

      socket.on("typing:stop", (payload: { userId: string }) => {
        socket.broadcast.emit("typing:stop", payload);
      });
    });
  }

  res.end();
}
