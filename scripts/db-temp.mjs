#!/usr/bin/env node

// Provision a throwaway Prisma Postgres database for local development and
// write it into .env.local. Temporary databases expire after a day, so this
// exists to make replacing one a single command.
//
//   npm run db:temp

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env.local");

const output = execFileSync(
  "npx",
  ["--yes", "create-db@latest", "create", "--region", "us-east-1", "--ttl", "24h"],
  { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"], timeout: 180000 }
);

const connection = output.match(/postgres:\/\/\S+/)?.[0];
const claim = output.match(/https:\/\/create-db\.prisma\.io\/claim\S*?(?=[\s&]|$)/)?.[0];

if (!connection) {
  console.error("create-db did not return a connection string.");
  process.exit(1);
}

function upsert(text, key, value) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  if (pattern.test(text)) {
    return text.replace(pattern, line);
  }
  return `${text.replace(/\n*$/, "")}\n${line}\n`.replace(/^\n/, "");
}

let env = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
env = upsert(env, "DATABASE_URL", connection);
if (claim) {
  env = upsert(env, "DATABASE_CLAIM_URL", claim);
}
if (!/^BETTER_AUTH_SECRET=/m.test(env)) {
  const { randomBytes } = await import("node:crypto");
  env = upsert(env, "BETTER_AUTH_SECRET", randomBytes(32).toString("hex"));
}
if (!/^BETTER_AUTH_URL=/m.test(env)) {
  env = upsert(env, "BETTER_AUTH_URL", "http://127.0.0.1:43147");
}
writeFileSync(envPath, env);

// Never print the credential itself.
console.log(`DATABASE_URL written to .env.local (${new URL(connection).hostname})`);
if (claim) {
  console.log(`Claim it to keep it: ${claim}`);
}
console.log("Restart npm run dev, then npm run smoke.");
