import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import { schema } from "@/lib/db/schema";
import { SCHEMA_SQL } from "@/lib/db/sql";

export function hasRemoteDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export function canUseDatabase() {
  return hasRemoteDatabase();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any = null;
let sql: ReturnType<typeof postgres> | null = null;
let migrated = false;

export function getDb() {
  if (!db) {
    throw new Error("Call ensureDb() before getDb().");
  }
  return db;
}

export async function ensureDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("No cloud database is configured.");
  }

  if (!sql) {
    sql = postgres(process.env.DATABASE_URL, {
      max: 1,
      ssl: "require",
      prepare: false,
    });
    db = drizzle(sql, { schema });
  }

  if (!migrated) {
    const statements = SCHEMA_SQL.split(";")
      .map((statement) => statement.trim())
      .filter(Boolean);
    for (const statement of statements) {
      await sql.unsafe(statement);
    }
    migrated = true;
  }

  return db;
}
