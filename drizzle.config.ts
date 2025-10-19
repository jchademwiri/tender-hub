import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts", // path to your schema file
  out: "./drizzle", // output folder for migrations
  dialect: "postgresql", // we're using Neon (PostgreSQL)
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
  verbose: true,
  strict: true,
} satisfies Config;
