import { defineConfig } from "drizzle-kit";

const dbUrl = "file:./drizzle/toki.db";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle/migrations",
  dbCredentials: {
    url: dbUrl,
  },
  verbose: true,
  strict: true,
});
