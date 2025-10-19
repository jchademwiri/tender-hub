

// src/db.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// Load dotenv synchronously in Node.js environments (development only)
// Note: .env.local is only loaded in development; production relies on externally provided environment variables
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
  try {
    // Use require for synchronous loading to ensure env vars are available before DB initialization
    require('dotenv').config({ path: '.env.local',  debug: true });
  } catch (error) {
    // dotenv not available - continue with existing environment variables
  }
}

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql, schema });