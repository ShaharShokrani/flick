#!/usr/bin/env node

// Report a deployed site's runtime state in a few lines, so checking it
// costs one command instead of a pile of curl invocations.
//
//   node scripts/site.mjs <url> [--wait-for "<text>"] [--timeout 300]
//
// --wait-for polls the page and its JavaScript bundles until the text
// appears, which is how you confirm a push actually deployed.

const args = process.argv.slice(2);
const url = args.find((arg) => !arg.startsWith("--"));

if (!url) {
  console.error("Usage: node scripts/site.mjs <url> [--wait-for TEXT]");
  process.exit(2);
}

function flag(name) {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? null : args[index + 1];
}

const base = url.replace(/\/$/, "");
const waitFor = flag("wait-for");
const timeoutSeconds = Number(flag("timeout") ?? 300);

async function get(path, timeoutMs = 20000) {
  const startedAt = Date.now();
  try {
    const response = await fetch(`${base}${path}`, {
      headers: { "cache-control": "no-cache" },
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await response.text();
    return { status: response.status, text, ms: Date.now() - startedAt };
  } catch (error) {
    return { status: 0, text: String(error.message ?? error), ms: Date.now() - startedAt };
  }
}

function parse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function bundleText() {
  const page = await get("/");
  if (page.status !== 200) {
    return { reachable: false, text: "", status: page.status };
  }
  const chunks = [...new Set(page.text.match(/\/_next\/static\/[^"']+\.js/g) ?? [])];
  const parts = await Promise.all(chunks.map((chunk) => get(chunk, 20000)));
  return {
    reachable: true,
    status: page.status,
    text: page.text + parts.map((part) => part.text).join(""),
  };
}

async function report() {
  const health = await get("/api/health/db", 45000);
  const body = parse(health.text);
  if (body) {
    const seen = (body.seen ?? [])
      .map((entry) => `${entry.name}(${entry.protocol})`)
      .join(" ");
    console.log(
      `health   ${health.status} ok=${body.ok ?? false}${body.source ? ` via=${body.source}` : ""}${
        body.target?.host ? ` host=${body.target.host}` : ""
      }${seen ? ` saw=${seen}` : ""}`
    );
    if (body.error) {
      console.log(`         ${body.error}`);
    }
  } else {
    console.log(`health   ${health.status} ${health.text.slice(0, 120)}`);
  }

  const features = parse((await get("/api/auth/features")).text);
  console.log(
    features
      ? `features configured=${features.configured} google=${features.google}`
      : "features unreadable"
  );

  const session = await get("/api/auth/get-session");
  console.log(`session  ${session.status} in ${session.ms}ms`);

  if (health.status === 302 || session.status === 302) {
    console.log("note     302 means Vercel deployment protection; open it in a browser instead");
  }

  return body?.ok === true;
}

if (waitFor) {
  const deadline = Date.now() + timeoutSeconds * 1000;
  let found = false;
  while (Date.now() < deadline) {
    const bundle = await bundleText();
    if (bundle.text.includes(waitFor)) {
      found = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 20000));
  }
  console.log(`deployed ${found ? "yes" : `no (waited ${timeoutSeconds}s)`}`);
  if (!found) {
    await report();
    process.exit(1);
  }
}

const ok = await report();
process.exit(ok ? 0 : 1);
