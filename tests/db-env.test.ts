import assert from "node:assert/strict";
import { test } from "node:test";

import {
  databaseEnvProblem,
  describeDatabaseEnv,
  resolveDatabaseUrl,
} from "../lib/db/env.ts";

const ACCELERATE = "prisma+postgres://accelerate.prisma-data.net/?api_key=k";
const DIRECT = "postgres://user:pw@db.prisma.io:5432/postgres?sslmode=require";

test("accepts a direct connection string", () => {
  const resolved = resolveDatabaseUrl({ DATABASE_URL: DIRECT });
  assert.equal(resolved?.source, "DATABASE_URL");
  assert.equal(resolved?.url, DIRECT);
});

test("refuses a Prisma client-only URL", () => {
  assert.equal(resolveDatabaseUrl({ DATABASE_URL: ACCELERATE }), null);
  const problem = databaseEnvProblem({ DATABASE_URL: ACCELERATE });
  assert.match(problem, /no Postgres driver can open/);
  assert.match(problem, /Generate new connection string/);
  assert.match(problem, /pooled\.db\.prisma\.io:5432/);
});

test("falls back to another variable when DATABASE_URL is unusable", () => {
  const resolved = resolveDatabaseUrl({
    DATABASE_URL: ACCELERATE,
    POSTGRES_URL: DIRECT,
  });
  assert.equal(resolved?.source, "POSTGRES_URL");
});

test("prefers an unpooled URL over a pooled one", () => {
  const resolved = resolveDatabaseUrl({
    POSTGRES_URL: "postgres://u:p@pooled.example.com/db",
    POSTGRES_URL_NON_POOLING: "postgres://u:p@direct.example.com/db",
  });
  assert.equal(resolved?.source, "POSTGRES_URL_NON_POOLING");
});

test("finds a URL under an unexpected variable name", () => {
  const resolved = resolveDatabaseUrl({ FLICK_DATABASE_URL: DIRECT });
  assert.equal(resolved?.source, "FLICK_DATABASE_URL");
});

test("builds a URL from discrete Postgres variables", () => {
  const resolved = resolveDatabaseUrl({
    PGHOST: "db.example.com",
    PGUSER: "me",
    PGPASSWORD: "pw",
    PGDATABASE: "flick",
  });
  assert.ok(resolved);
  const url = new URL(resolved.url);
  assert.equal(url.hostname, "db.example.com");
  assert.equal(url.port, "5432");
  assert.equal(url.pathname, "/flick");
  assert.equal(url.searchParams.get("sslmode"), "require");
});

test("ignores auth and public variables", () => {
  const env = {
    BETTER_AUTH_URL: "https://flick.vercel.app",
    NEXT_PUBLIC_APP_URL: "https://flick.vercel.app",
  };
  assert.equal(resolveDatabaseUrl(env), null);
  assert.deepEqual(describeDatabaseEnv(env), []);
  assert.match(databaseEnvProblem(env), /No database URL is set/);
});

test("reports names and protocols without credentials", () => {
  const seen = describeDatabaseEnv({ DATABASE_URL: DIRECT });
  assert.deepEqual(seen, [{ name: "DATABASE_URL", protocol: "postgres" }]);
  assert.ok(!JSON.stringify(seen).includes("pw"));
});
