import { toNextJsHandler } from "better-auth/next-js";

import { getAuth, isAuthConfigured } from "@/lib/auth";
import { json } from "@/lib/api";
import { ensureDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handler(request: Request) {
  if (!isAuthConfigured()) {
    return json(
      {
        error:
          "Sign-in is not configured. Add BETTER_AUTH_SECRET and DATABASE_URL.",
      },
      503
    );
  }
  await ensureDb();
  const auth = getAuth();
  if (!auth) {
    return json({ error: "Sign-in is not configured." }, 503);
  }
  return auth.handler(request);
}

export const { GET, POST, PATCH, PUT, DELETE } = toNextJsHandler(handler);
