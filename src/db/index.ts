

// src/db.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// Only load dotenv in Node.js environments, not in Edge Runtime
if (typeof process !== 'undefined' && process.env && typeof window === 'undefined') {
  try {
    // Use dynamic import to prevent bundling in Edge Runtime
    import('dotenv').then(({ config }) => {
      config({ path: ".env.local" });
    }).catch(() => {
      // dotenv not available or not needed
    });
  } catch (error) {
    // Silently continue if dotenv is not available
  }
}

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql, schema });