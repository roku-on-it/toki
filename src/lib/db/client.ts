import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "@/lib/db/schema";

const DATABASE_URL = "file:./drizzle/toki.db";

const client = createClient({
  url: DATABASE_URL,
});

export const db = drizzle(client, { schema });
