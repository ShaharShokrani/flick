#!/usr/bin/env node

import { execSync } from "node:child_process";
import { chmodSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const hooksDir = join(root, ".githooks");

if (!existsSync(join(root, ".git"))) {
  process.exit(0);
}

execSync("git config core.hooksPath .githooks", { cwd: root, stdio: "ignore" });

if (existsSync(hooksDir)) {
  for (const name of readdirSync(hooksDir)) {
    chmodSync(join(hooksDir, name), 0o755);
  }
}
