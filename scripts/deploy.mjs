#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://temporary-brisk-mesa-ty777ur.vercel.app";

if (!existsSync(join(root, ".vercel", "anonymous.json")) && !process.env.VERCEL_TOKEN) {
  console.error(
    "No Vercel anonymous session. Run npm run deploy from the machine that first published the site."
  );
  process.exit(1);
}

const child = spawn(
  "npx",
  ["--yes", "vercel@latest", "deploy", "--yes", "--prod", "--temporary"],
  {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  }
);

child.on("exit", (code) => {
  if (code === 0) {
    console.log(`Live: ${SITE}`);
  }
  process.exit(code ?? 1);
});
