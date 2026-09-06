<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Working on Flick

Read this before exploring. It exists so an agent can start work without
re-deriving the project from the file tree.

## What this is

A flashcard PWA. A card is a word, its English translation, and an
optional example. Reviews are Yes/No with spaced repetition.

Next.js App Router, React, TypeScript, Tailwind, shadcn/ui. Dev server
runs on port `43147`.

Product rules live in `.cursor/memory/intent.md`. A generated map of
routes, files, and exports lives in `.cursor/memory/codebase.md`. Read
those two files instead of searching the tree.

## Commands

```bash
npm run dev       # port 43147, hostname 0.0.0.0
npm run verify    # types + lint + tests + memory freshness, in one call
npm run smoke     # real sign-in and deck flow against the local server
npm run site -- <url>   # a deployment's database, features, and session
npm run db:temp   # fresh throwaway Postgres into .env.local
npm run add-word -- --word haus --translation house --known
```

Use these instead of writing one-off probes. `npm run verify` replaces
separate `tsc`, `eslint`, and test calls and prints almost nothing when
it passes. `npm run smoke` proves sign-in and card writes really work,
which no amount of reading can. `npm run site` accepts
`--wait-for "<text>"` to poll until a push is actually deployed, so you
never hand-roll a curl loop. `npm run build` is slow and rarely says
anything `verify` did not.

## Where things live

- `lib/schedule.ts` — intervals, ease, knowledge %
- `lib/card-model.ts` — parsing and upsert rules
- `lib/deck-store.ts`, `lib/deck-context.tsx` — client deck state
- `lib/db/env.ts` — which env var holds the Postgres URL
- `lib/db/index.ts`, `lib/db/schema.ts`, `lib/db/sql.ts` — connection and tables
- `lib/auth.ts`, `lib/user-cards.ts` — Better Auth and per-user cards
- `app/api/cards/route.ts` — deck API
- `app/api/health/db/route.ts` — connection diagnostics
- `components/` — UI; primitives in `components/ui` are shadcn, do not hand-roll

## Database

Words for signed-in users live in cloud Postgres. Nothing is stored on
the device as the real store.

`DATABASE_URL` must be a driver-compatible string:

```
postgres://USER:PASSWORD@HOST:5432/postgres?sslmode=require
```

A `prisma+postgres://accelerate.prisma-data.net/?api_key=…` URL is
rejected on purpose: it is an HTTP endpoint that only Prisma's own
client can open, and a Postgres driver just times out on port 5432.
Do not try to convert one — the direct credentials are unrelated to the
API key. Do not reach for `@prisma/ppg` either; it requires the same
direct string. The direct string lives in the Prisma Console under the
database's **API Keys** section.
`lib/db/env.ts` will fall back to `POSTGRES_URL`,
`POSTGRES_URL_NON_POOLING`, `DATABASE_URL_UNPOOLED`, any other
`*DATABASE*URL`-ish variable, or `PGHOST`-style parts.

To diagnose any deployment, ask it rather than reading code:

```bash
curl -sS https://<host>/api/health/db
```

It reports whether the connection works, which variable was used, which
host was dialed, and every database variable it can see. It never
returns credentials.

## Deployment

Push to `main` on GitHub and Vercel deploys it. That is the only way to
change production from here.

This machine **cannot** set Vercel environment variables and **cannot**
run the Vercel CLI: the project is claimed on the owner's account and
the local anonymous session is dead. `npm run deploy` and the pre-push
hook both fail on this by design and the push continues. Do not retry
the CLI or try to work around it — if production needs an env var, say
so in your reply.

## Dead ends, already tried

Do not spend calls re-testing these.

- An Accelerate URL cannot be converted to a direct one. The direct
  credentials are a 64-char identifier and a separate key, unrelated to
  the API key in `prisma+postgres://…?api_key=`.
- `@prisma/ppg`, despite being Prisma's own serverless client, also
  requires the direct TCP string. Only the full Prisma ORM client can
  use an Accelerate URL, which would mean codegen at build time.
- `create-db` only ever prints a direct connection string, so there is
  no way to get an Accelerate key here to test against.
- The Vercel CLI cannot deploy and cannot read or write environment
  variables from this machine.
- Better Auth rejects any origin outside `trustedOrigins` with
  `403 INVALID_ORIGIN`. Deployment hostnames come from
  `lib/auth-origins.ts`; a wildcard scoped to the project name works,
  a bare `https://*.vercel.app` is too wide.

## Secrets

`.env.local` is local-only and gitignored. Never commit it, never print
a connection string or token into the transcript, and never echo one
into a file that gets committed. `.env.example` documents names only.

## Token discipline

- Start from `.cursor/memory/*.md`, not a repo-wide search.
- Never grep or read `package-lock.json`; it is 400KB and `package.json`
  has what you need. Scope searches with a glob (`*.ts`, `*.tsx`) so the
  lockfile cannot swallow a search. It is excluded from indexing in
  `.cursorindexingignore`.
- One `npm run verify` beats three separate checks.
- Curl an endpoint to learn runtime state instead of reading the code
  that produces it.
- Read a whole small file once rather than several overlapping slices of
  a big one.
- Do not re-probe production repeatedly while waiting for a deploy. Use
  `npm run site -- <url> --wait-for "<text>"` once.
- The lockfile and the generated memory snapshot are marked `-diff` in
  `.gitattributes`, so `git diff` stays readable. Leave that alone.
- Keep `.cursor/memory/intent.md` short. It is loaded often, so put
  durable rules there and leave incident detail in commit messages.
