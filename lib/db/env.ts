// Hosting integrations name the Postgres URL differently, and some of
// them inject a client-only URL alongside a usable one. Find whichever
// variable holds a real connection string instead of trusting one name.

type Env = Record<string, string | undefined>;

const PREFERRED_NAMES = [
  "DATABASE_URL",
  "POSTGRES_URL_NON_POOLING",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "PRISMA_DATABASE_URL",
  "NEON_DATABASE_URL",
];

const URL_NAME_PATTERN = /^(?!.*(BETTER_AUTH|NEXT_PUBLIC)).*(DATABASE|POSTGRES|PG).*(URL|URI|STRING)$/;

const DIRECT_PROTOCOLS = new Set(["postgres:", "postgresql:"]);

// `prisma+postgres://` and `prisma://` address Prisma's HTTP gateway,
// which no Postgres driver can dial.
const CLIENT_ONLY_PROTOCOLS = new Set(["prisma:", "prisma+postgres:"]);

function protocolOf(value: string) {
  try {
    return new URL(value).protocol;
  } catch {
    return null;
  }
}

function isDirect(value: string | undefined) {
  return Boolean(value && DIRECT_PROTOCOLS.has(protocolOf(value) ?? ""));
}

function candidateNames(env: Env) {
  const names = new Set(PREFERRED_NAMES);
  for (const name of Object.keys(env)) {
    if (URL_NAME_PATTERN.test(name)) {
      names.add(name);
    }
  }
  return [...names];
}

function fromParts(env: Env) {
  const host = env.POSTGRES_HOST ?? env.PGHOST;
  const user = env.POSTGRES_USER ?? env.PGUSER;
  const password = env.POSTGRES_PASSWORD ?? env.PGPASSWORD;
  const database =
    env.POSTGRES_DATABASE ?? env.PGDATABASE ?? env.POSTGRES_DB ?? "postgres";
  if (!host || !user || !password) {
    return null;
  }
  const port = env.POSTGRES_PORT ?? env.PGPORT ?? "5432";
  const url = new URL(`postgres://${host}:${port}/${database}`);
  url.username = encodeURIComponent(user);
  url.password = encodeURIComponent(password);
  url.searchParams.set("sslmode", "require");
  return { url: url.toString(), source: "POSTGRES_HOST/PGHOST" };
}

export type ResolvedDatabase = { url: string; source: string };

export function resolveDatabaseUrl(
  env: Env = process.env
): ResolvedDatabase | null {
  for (const name of candidateNames(env)) {
    if (isDirect(env[name])) {
      return { url: env[name]!, source: name };
    }
  }
  return fromParts(env);
}

/** Variable names and protocols only — never their credentials. */
export function describeDatabaseEnv(env: Env = process.env) {
  const present: { name: string; protocol: string | null }[] = [];
  for (const name of candidateNames(env)) {
    const value = env[name];
    if (value) {
      present.push({ name, protocol: protocolOf(value)?.slice(0, -1) ?? null });
    }
  }
  return present;
}

// Prisma shows this only after "Connect to your database" ->
// "Generate new connection string". Pooled is the right one for
// serverless, where every request may open its own connection.
const HOW_TO_GET_ONE =
  'In the Prisma Console open your database, click "Connect to your database", click "Generate new connection string", and copy the pooled string: postgres://USER:PASSWORD@pooled.db.prisma.io:5432/postgres?sslmode=require';

export function databaseEnvProblem(env: Env = process.env) {
  const present = describeDatabaseEnv(env);
  if (present.length === 0 && !fromParts(env)) {
    return `No database URL is set on this deployment. Save one as DATABASE_URL. ${HOW_TO_GET_ONE}`;
  }

  const clientOnly = present.filter((entry) =>
    CLIENT_ONLY_PROTOCOLS.has(`${entry.protocol}:`)
  );
  if (clientOnly.length > 0) {
    const names = clientOnly.map((entry) => entry.name).join(", ");
    return `${names} holds a ${clientOnly[0].protocol} URL. That address is Prisma's HTTP gateway, which no Postgres driver can open — it needs a URL with a username and password in it. ${HOW_TO_GET_ONE}`;
  }

  const names = present.map((entry) => `${entry.name} (${entry.protocol})`);
  return `No usable Postgres URL found. Saw: ${names.join(", ")}. DATABASE_URL must start with postgres://`;
}
