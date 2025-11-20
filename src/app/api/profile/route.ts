import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getUserBySecretKey } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { emitSocketEvent } from "@/lib/socket-server";

export async function PATCH(request: NextRequest) {
  const secretKey = request.headers.get("x-secret-key")?.trim();
  if (!secretKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await getUserBySecretKey(secretKey);
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const displayName = typeof body?.displayName === "string" ? body.displayName.trim() : "";
  const avatarBase64 = typeof body?.avatarBase64 === "string" ? body.avatarBase64.trim() : null;

  if (displayName.length < 2 || displayName.length > 40) {
    return NextResponse.json({ error: "Name must be between 2 and 40 characters." }, { status: 400 });
  }

  if (avatarBase64 && avatarBase64.length > 500_000) {
    return NextResponse.json({ error: "Avatar is too large." }, { status: 400 });
  }

  const valuesToUpdate: Partial<typeof users.$inferInsert> = {
    displayName,
  };

  if (avatarBase64) {
    valuesToUpdate.avatarBase64 = avatarBase64;
  }

  const [updated] = await db
    .update(users)
    .set(valuesToUpdate)
    .where(eq(users.id, currentUser.id))
    .returning({
      id: users.id,
      displayName: users.displayName,
      avatarBase64: users.avatarBase64,
      secretKey: users.secretKey,
    });

  emitSocketEvent("user:updated", {
    id: updated.id,
    displayName: updated.displayName,
    avatarBase64: updated.avatarBase64,
  });

  return NextResponse.json(updated);
}
