import { NextRequest, NextResponse } from "next/server";
import { desc, eq, lt } from "drizzle-orm";

import { getUserBySecretKey } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { messages, users } from "@/lib/db/schema";
import { emitSocketEvent } from "@/lib/socket-server";
import type { ChatMessagePayload } from "@/lib/types/chat";

const DEFAULT_LIMIT = 20;

async function authenticate(request: NextRequest) {
  const secretKey = request.headers.get("x-secret-key")?.trim();
  if (!secretKey) return null;
  return getUserBySecretKey(secretKey);
}

function formatMessage(row: {
  id: number;
  body: string;
  sentAt: Date;
  authorId: string;
  displayName: string;
  avatarBase64: string | null;
}): ChatMessagePayload {
  return {
    id: row.id,
    body: row.body,
    sentAt: row.sentAt.toISOString(),
    author: {
      id: row.authorId,
      displayName: row.displayName,
      avatarBase64: row.avatarBase64,
    },
  };
}

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get("limit")) || DEFAULT_LIMIT;
  const limit = Math.max(1, Math.min(limitParam, 50));
  const cursorParam = searchParams.get("cursor");
  const cursor = cursorParam ? Number(cursorParam) : null;

  const baseQuery = db
    .select({
      id: messages.id,
      body: messages.body,
      sentAt: messages.sentAt,
      authorId: users.id,
      displayName: users.displayName,
      avatarBase64: users.avatarBase64,
    })
    .from(messages)
    .innerJoin(users, eq(users.id, messages.userId))
    .$dynamic();

  const rows = await (cursor
    ? baseQuery.where(lt(messages.id, cursor))
    : baseQuery
  )
    .orderBy(desc(messages.id))
    .limit(limit + 1);
  const hasMore = rows.length > limit;
  const sliced = hasMore ? rows.slice(0, limit) : rows;
  const oldestRow = sliced[sliced.length - 1];
  const formatted = sliced.map(formatMessage).reverse();

  return NextResponse.json({
    messages: formatted,
    nextCursor: hasMore && oldestRow ? oldestRow.id : null,
  });
}

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const messageBody = typeof body?.body === "string" ? body.body.trim() : "";

  if (!messageBody) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  if (messageBody.length > 1000) {
    return NextResponse.json({ error: "Message is too long" }, { status: 400 });
  }

  const [inserted] = await db
    .insert(messages)
    .values({
      body: messageBody,
      userId: user.id,
    })
    .returning({
      id: messages.id,
      body: messages.body,
      sentAt: messages.sentAt,
    });

  const payload: ChatMessagePayload = {
    id: inserted.id,
    body: inserted.body,
    sentAt: inserted.sentAt.toISOString(),
    author: {
      id: user.id,
      displayName: user.displayName,
      avatarBase64: user.avatarBase64,
    },
  };

  emitSocketEvent("message:new", payload);

  return NextResponse.json(payload, { status: 201 });
}
