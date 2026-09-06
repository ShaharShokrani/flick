#!/usr/bin/env node

// Exercise the real sign-in and deck flow against a running server, so
// verifying a change costs one command instead of a hand-written probe.
//
//   node scripts/smoke.mjs [--base http://127.0.0.1:43147]

const args = process.argv.slice(2);
const baseIndex = args.indexOf("--base");
const base = (baseIndex === -1 ? "http://127.0.0.1:43147" : args[baseIndex + 1]).replace(/\/$/, "");
const origin = base;

// A fixed guest keeps repeat runs from piling up throwaway accounts.
const CODE = "SMOK-ETST";
const EMAIL = `guest-${CODE.toLowerCase()}@flick.guest`;

let failures = 0;

// Detail is only worth printing when something broke.
function check(name, ok, detail = "") {
  if (!ok) {
    failures += 1;
  }
  console.log(`${ok ? "pass" : "FAIL"}  ${name}${!ok && detail ? `  ${detail}` : ""}`);
}

async function call(path, init = {}, cookie = "") {
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      origin,
      referer: `${origin}/`,
      ...(cookie ? { cookie } : {}),
      ...init.headers,
    },
  });
  const text = await response.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }
  return { status: response.status, body, text, response };
}

function cookieFrom(response) {
  const all =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [response.headers.get("set-cookie")].filter(Boolean);
  return all.map((value) => String(value).split(";")[0]).join("; ");
}

const health = await call("/api/health/db");
check(
  "database reachable",
  health.body?.ok === true,
  health.body?.error ?? health.text.slice(0, 100)
);

if (health.body?.ok !== true) {
  console.log("\nNo database, so sign-in cannot be exercised. Fix that first.");
  process.exit(1);
}

const features = await call("/api/auth/features");
check("sign-in configured", features.body?.configured === true);

let cookie = "";
const signIn = await call("/api/auth/sign-in/email", {
  method: "POST",
  body: JSON.stringify({ email: EMAIL, password: CODE }),
});

if (signIn.status === 200) {
  cookie = cookieFrom(signIn.response);
  check("guest sign-in", Boolean(cookie));
} else {
  const signUp = await call("/api/auth/sign-up/email", {
    method: "POST",
    body: JSON.stringify({ email: EMAIL, password: CODE, name: "Guest" }),
  });
  cookie = cookieFrom(signUp.response);
  check("guest sign-up", signUp.status === 200 && Boolean(cookie), signUp.text.slice(0, 80));
}

if (!cookie) {
  console.log("\nNo session cookie, so the deck cannot be checked.");
  process.exit(1);
}

const session = await call("/api/auth/get-session", {}, cookie);
check("session readable", Boolean(session.body?.user?.id));

const word = `smoke-${Date.now().toString(36)}`;
const added = await call(
  "/api/cards",
  {
    method: "POST",
    body: JSON.stringify({ word, translation: "smoke test", example: "Added by npm run smoke." }),
  },
  cookie
);
check("word saved to the cloud", added.status === 201, added.text.slice(0, 80));

const listed = await call("/api/cards", {}, cookie);
const saved = (listed.body?.cards ?? []).find((card) => card.word === word);
check("word reads back", Boolean(saved));

if (saved) {
  const reviewed = await call(
    "/api/cards",
    { method: "PATCH", body: JSON.stringify({ id: saved.id, remembered: true }) },
    cookie
  );
  const card = (reviewed.body?.cards ?? []).find((item) => item.id === saved.id);
  check("yes schedules a later review", card?.intervalDays >= 1 && card?.known === true);

  const deleted = await call(`/api/cards?id=${encodeURIComponent(saved.id)}`, { method: "DELETE" }, cookie);
  check("word deletes", deleted.status === 200);
}

const anonymous = await call("/api/cards");
check("signed-out deck is empty", (anonymous.body?.cards ?? []).length === 0);

console.log(failures === 0 ? "\nall smoke checks pass" : `\n${failures} smoke check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
