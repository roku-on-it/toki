import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const secretInput = typeof body?.secretKey === "string" ? body.secretKey.trim() : null;

  if (!secretInput || secretInput.length === 0 || secretInput.length > 32) {
    return NextResponse.json({ error: "Invalid secret key" }, { status: 400 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.secretKey, secretInput),
    columns: {
      id: true,
      displayName: true,
      avatarBase64: true,
      secretKey: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}
