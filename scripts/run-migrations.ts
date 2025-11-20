import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

const DATABASE_URL = "file:./drizzle/toki.db";
const client = createClient({ url: DATABASE_URL });
const db = drizzle(client);

async function main() {
  await migrate(db, { migrationsFolder: "./drizzle/migrations" });
  console.log("Database migrations applied");
}

main()
  .catch((error) => {
    console.error("Migration failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await client.close();
  });
