import postgres from "postgres";

import { json } from "@/lib/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Failure = {
  message?: string;
  code?: string;
  errno?: string;
};

function describeTarget(raw: string) {
  try {
    const url = new URL(raw);
    return {
      protocol: url.protocol.replace(":", ""),
      host: url.hostname,
      port: url.port || null,
      database: url.pathname.replace("/", "") || null,
      hasUser: Boolean(url.username),
      hasPassword: Boolean(url.password),
      options: [...url.searchParams.keys()],
    };
  } catch {
    return { unreadable: true };
  }
}

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return json(
      { ok: false, error: "DATABASE_URL is not set on this deployment." },
      503
    );
  }

  const target = describeTarget(url);
  const startedAt = Date.now();
  let sql: ReturnType<typeof postgres> | null = null;

  try {
    sql = postgres(url, {
      max: 1,
      ssl: "require",
      prepare: false,
      connect_timeout: 10,
      idle_timeout: 5,
    });
    const rows = await sql`select 1 as ok`;
    return json({ ok: rows[0]?.ok === 1, target, ms: Date.now() - startedAt });
  } catch (error) {
    const failure = error as Failure;
    return json(
      {
        ok: false,
        target,
        ms: Date.now() - startedAt,
        error: failure.message ?? "Could not reach the database.",
        code: failure.code ?? failure.errno ?? null,
      },
      500
    );
  } finally {
    try {
      await sql?.end({ timeout: 2 });
    } catch {
      // The pool is disposable; a failed teardown must not mask the result.
    }
  }
}
