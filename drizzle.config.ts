import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config();

const dbUrl = process.env.DATABASE_URL || "";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle/migrations",
  dbCredentials: {
    url: dbUrl,
  },
  verbose: true,
  strict: true,
});
