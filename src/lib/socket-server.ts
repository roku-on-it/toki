import { Server as SocketIOServer } from "socket.io";

const globalForSocket = globalThis as unknown as {
  io?: SocketIOServer;
};

export function getSocketServer(httpServer?: any) {
  if (!globalForSocket.io && httpServer) {
    globalForSocket.io = new SocketIOServer(httpServer, {
      path: "/api/socket/io",
      addTrailingSlash: false,
    });
  }

  return globalForSocket.io;
}

export function emitSocketEvent(event: string, payload: unknown) {
  globalForSocket.io?.emit(event, payload);
}
