import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/lib/db/schema";

const DATABASE_URL = process.env.DATABASE_URL!;

const client = postgres(DATABASE_URL);

export const db = drizzle(client, { schema });
