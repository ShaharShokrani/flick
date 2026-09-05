import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import { schema } from "@/lib/db/schema";
import { SCHEMA_SQL } from "@/lib/db/sql";

export class DatabaseUnavailableError extends Error {
  constructor(cause?: unknown) {
    super("The words database is unreachable.");
    this.name = "DatabaseUnavailableError";
    this.cause = cause;
  }
}

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
    throw new DatabaseUnavailableError("DATABASE_URL is not set.");
  }

  if (!sql) {
    sql = postgres(process.env.DATABASE_URL, {
      max: 1,
      ssl: "require",
      prepare: false,
      // Serverless requests should surface a bad database faster than
      // the platform's own request timeout.
      connect_timeout: 10,
      idle_timeout: 20,
    });
    db = drizzle(sql, { schema });
  }

  if (!migrated) {
    const statements = SCHEMA_SQL.split(";")
      .map((statement) => statement.trim())
      .filter(Boolean);
    try {
      for (const statement of statements) {
        await sql.unsafe(statement);
      }
    } catch (error) {
      // A half-open pool would keep failing, so drop it and let the next
      // request build a fresh one.
      const broken = sql;
      sql = null;
      db = null;
      void broken.end({ timeout: 2 }).catch(() => {});
      throw new DatabaseUnavailableError(error);
    }
    migrated = true;
  }

  return db;
}
