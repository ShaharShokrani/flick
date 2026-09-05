#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://temporary-brisk-mesa-ty777ur.vercel.app";
const PROJECT_ID =
  process.env.VERCEL_PROJECT_ID || "prj_RtcpA91DNOvaP7WLfx1DO9Z4K4UV";

const token = process.env.VERCEL_TOKEN;
const args = ["--yes", "vercel@latest", "deploy", "--yes", "--prod"];

if (token) {
  args.push("--token", token, "--project", PROJECT_ID);
  if (process.env.VERCEL_ORG_ID) {
    args.push("--scope", process.env.VERCEL_ORG_ID);
  }
} else if (existsSync(join(root, ".vercel", "anonymous.json"))) {
  // Claimed projects reject the anonymous session after the owner takes them.
  console.error(
    [
      `${SITE} is claimed on a Vercel account, so this machine cannot publish with the old anonymous session.`,
      "Connect github.com/ShaharShokrani/flick to that project in the Vercel dashboard (Settings → Git),",
      "or set VERCEL_TOKEN and VERCEL_ORG_ID and run npm run deploy.",
    ].join("\n")
  );
  process.exit(1);
} else {
  console.error(
    "No Vercel credentials. Set VERCEL_TOKEN or connect the GitHub repo to the claimed project."
  );
  process.exit(1);
}

const child = spawn("npx", args, {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => {
  if (code === 0) {
    console.log(`Live: ${SITE}`);
  }
  process.exit(code ?? 1);
});
