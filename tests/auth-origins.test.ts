import assert from "node:assert/strict";
import { test } from "node:test";

import { trustedOriginsFor } from "../lib/auth-origins.ts";

const APP = "https://flick.vercel.app";

test("always trusts the configured app URL and local dev", () => {
  const origins = trustedOriginsFor(APP, {});
  assert.deepEqual(origins, [
    APP,
    "http://127.0.0.1:43147",
    "http://localhost:43147",
  ]);
});

test("trusts the hostname a deployment is served on", () => {
  const origins = trustedOriginsFor(APP, {
    VERCEL_URL: "flick-h79km1-team.vercel.app",
  });
  assert.ok(origins.includes("https://flick-h79km1-team.vercel.app"));
});

test("covers sibling deployment URLs of the same project", () => {
  const origins = trustedOriginsFor(APP, {
    VERCEL_PROJECT_PRODUCTION_URL: "flick.vercel.app",
  });
  assert.ok(origins.includes("https://flick-*.vercel.app"));
});

test("does not widen the wildcard past the project name", () => {
  const origins = trustedOriginsFor(APP, {
    VERCEL_PROJECT_PRODUCTION_URL: "flick.vercel.app",
  });
  assert.ok(!origins.includes("https://*.vercel.app"));
  assert.ok(origins.every((origin) => !origin.startsWith("https://*")));
});

test("skips the wildcard for a custom domain", () => {
  const origins = trustedOriginsFor(APP, {
    VERCEL_PROJECT_PRODUCTION_URL: "flick.app",
  });
  assert.ok(origins.includes("https://flick.app"));
  assert.ok(!origins.some((origin) => origin.includes("*")));
});

test("lists each origin once", () => {
  const origins = trustedOriginsFor("https://flick.vercel.app", {
    VERCEL_URL: "flick.vercel.app",
    VERCEL_PROJECT_PRODUCTION_URL: "flick.vercel.app",
  });
  assert.equal(new Set(origins).size, origins.length);
});
