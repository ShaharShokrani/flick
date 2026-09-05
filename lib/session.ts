import { headers } from "next/headers";

import { getAuth, isAuthConfigured } from "@/lib/auth";
import { ensureDb } from "@/lib/db";

export async function getCurrentUser(request?: Request) {
  if (!isAuthConfigured()) {
    return null;
  }

  await ensureDb();
  const auth = getAuth();
  if (!auth) {
    return null;
  }

  const session = await auth.api.getSession({
    headers: request?.headers ?? (await headers()),
  });
  return session?.user ?? null;
}
