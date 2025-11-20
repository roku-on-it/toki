import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

config();

const DATABASE_URL = process.env.DATABASE_URL!;
const client = postgres(DATABASE_URL, { max: 1 });
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
    await client.end();
  });
