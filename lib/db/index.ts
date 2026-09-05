import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { schema } from "@/lib/db/schema";
import { SCHEMA_SQL } from "@/lib/db/sql";

export function hasRemoteDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export function canUseDatabase() {
  if (hasRemoteDatabase()) {
    return true;
  }
  return !process.env.VERCEL;
}

// Drizzle handles for Better Auth and card queries. Created in ensureDb().
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any = null;
let migrated = false;

export function getDb() {
  if (!db) {
    throw new Error("Call ensureDb() before getDb().");
  }
  return db;
}

export async function ensureDb() {
  if (!canUseDatabase()) {
    throw new Error("No shared database is configured.");
  }

  if (process.env.DATABASE_URL) {
    if (!db) {
      const { neon } = await import("@neondatabase/serverless");
      const { drizzle } = await import("drizzle-orm/neon-http");
      db = drizzle(neon(process.env.DATABASE_URL), { schema });
    }
    if (!migrated) {
      const { neon } = await import("@neondatabase/serverless");
      const sql = neon(process.env.DATABASE_URL);
      for (const statement of SCHEMA_SQL.split(";")
        .map((part) => part.trim())
        .filter(Boolean)) {
        await sql.query(statement);
      }
      migrated = true;
    }
    return db;
  }

  if (!db) {
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const dir = join(process.cwd(), "data", "pglite");
    mkdirSync(dir, { recursive: true });
    const client = new PGlite(dir);
    await client.exec(SCHEMA_SQL);
    db = drizzle(client, { schema });
    migrated = true;
  }
  return db;
}
