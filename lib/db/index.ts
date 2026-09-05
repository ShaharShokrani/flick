import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

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

// Prisma's `prisma+postgres://` URL speaks HTTP to Accelerate, so a
// Postgres driver just times out dialing port 5432 against it.
const CLIENT_ONLY_SCHEMES = new Set(["prisma:", "prisma+postgres:"]);

export function connectionStringProblem(raw: string | undefined) {
  if (!raw) {
    return "DATABASE_URL is not set on this deployment.";
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return "DATABASE_URL is not a valid connection string.";
  }
  if (CLIENT_ONLY_SCHEMES.has(url.protocol)) {
    return `DATABASE_URL is a ${url.protocol.slice(0, -1)} URL, which only Prisma's own client can open. Copy the direct connection string instead: postgres://USER:PASSWORD@db.prisma.io:5432/postgres?sslmode=require`;
  }
  if (!url.protocol.startsWith("postgres")) {
    return `DATABASE_URL must be a postgres:// connection string, not ${url.protocol.slice(0, -1)}.`;
  }
  return null;
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
  const problem = connectionStringProblem(process.env.DATABASE_URL);
  if (problem) {
    throw new DatabaseUnavailableError(problem);
  }

  if (!sql) {
    sql = postgres(process.env.DATABASE_URL!, {
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
