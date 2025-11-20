import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export async function getUserBySecretKey(secretKey: string) {
  return db.query.users.findFirst({
    where: eq(users.secretKey, secretKey),
  });
}
