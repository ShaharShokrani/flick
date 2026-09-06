import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import { databaseEnvProblem, resolveDatabaseUrl } from "@/lib/db/env";
import { schema } from "@/lib/db/schema";
import { SCHEMA_SQL } from "@/lib/db/sql";

export class DatabaseUnavailableError extends Error {
  readonly reason: string;

  constructor(reason: string, cause?: unknown) {
    super(reason);
    this.name = "DatabaseUnavailableError";
    this.reason = reason;
    this.cause = cause;
  }
}

export function hasRemoteDatabase() {
  return Boolean(resolveDatabaseUrl());
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
  const resolved = resolveDatabaseUrl();
  if (!resolved) {
    throw new DatabaseUnavailableError(databaseEnvProblem());
  }

  if (!sql) {
    sql = postgres(resolved.url, {
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
      throw new DatabaseUnavailableError(
        (error as Error).message ?? "Could not reach the database.",
        error
      );
    }
    migrated = true;
  }

  return db;
}
