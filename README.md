# Flick

A tiny flashcard app for the web and Android. Add a word, the English translation, and an optional example. Then flip through your deck and **swipe right for Yes**, **swipe left for No**.

- **Yes** — you know it. The next review waits longer: 1 day, then 3, then 7, then further apart.
- **No** — you do not know it. It leaves this session and comes back tomorrow.

Sign in with Google, email, or a guest code. Words are stored in a
cloud database, not on the phone.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:43147](http://localhost:43147).

```bash
npm run build
npm start
```

## How it works

1. Open **Words** to add or edit cards. Each word shows a % of how well you know it.
2. Start learning from the home screen. Only cards due today are shown. Each card starts from the word or the English at random — tap to see the other side and the example.
3. Tap to flip. Swipe right if you know it, left if you do not. Yes schedules a later day. No comes back tomorrow. The % on Words goes up after Yes and down after No.

The first visit includes a few sample words so you can try the flow immediately.

## Sign in

Words are saved in cloud Postgres (`DATABASE_URL` on Vercel).

- **Google** — if `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set.
- **Email** — create a login, then sign in.
- **Guest** — get a code (`XXXX-XXXX`) and enter it later.

Set `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` in Vercel. Optional Google redirect: `{BETTER_AUTH_URL}/api/auth/callback/google`.

`DATABASE_URL` must be a direct Postgres connection string:

```
postgres://USER:PASSWORD@HOST:5432/postgres?sslmode=require
```

Prisma also shows a `prisma+postgres://accelerate.prisma-data.net/?api_key=…`
URL. That one speaks HTTP to Accelerate and only Prisma's own client can
open it, so this app rejects it. In the Prisma Console, open the database
and copy the string for any Postgres client instead.

`GET /api/health/db` reports whether a deployment can reach its database,
which host it dialed, and how long the connection took. It never returns
credentials.

## Use it from anywhere

Deploy the GitHub repo to Vercel (one click):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ShaharShokrani/flick)

Then open the `https://….vercel.app` link in Chrome on your phone → menu → **Add to Home screen**.

The live site is https://temporary-brisk-mesa-ty777ur.vercel.app/

That project is claimed on Vercel. To publish every new commit to it,
connect this GitHub repo in the Vercel dashboard: the project →
**Settings → Git → Connect Repository → `ShaharShokrani/flick`**.

Or set `VERCEL_TOKEN` and `VERCEL_ORG_ID` and run `npm run deploy`.
Do not commit Vercel tokens.

Unsigned-in visitors see sample cards. Agent uploads on localhost still write `data/cards.json`.

## Add a word as an agent

Once a word is learned with the local user, upload it to their deck:

```bash
npm run add-word -- --word haus --translation house --example "Das Haus ist groß." --known
```

Or:

```bash
curl -s -X POST http://127.0.0.1:43147/api/cards \
  -H "Content-Type: application/json" \
  -d '{"word":"haus","translation":"house","example":"Das Haus ist groß.","known":true}'
```

`word` and `translation` are required. `--known` marks the card already learned so it will not keep showing in the next session. The same word is updated instead of duplicated.

`GET /api/cards?due=1` lists cards due today. `GET /api/cards?learned=1` lists words marked known at least once. If the app is not running, `npm run add-word` still writes `data/cards.json`.

## Codebase memory

Long-term memory for this git repo lives in `.cursor/memory/`.

- `.cursor/memory/intent.md` — durable product facts. Edit this when behavior changes.
- `.cursor/memory/codebase.md` — generated snapshot of routes, files, and exports. Do not edit.

Keep it current:

```bash
npm run memory:update
npm run memory:check
```

`npm install` points git at `.githooks/`. Every commit regenerates and stages the snapshot. Push refuses a stale snapshot. After a merge or branch checkout the snapshot is refreshed again. Set `SKIP_MEMORY=1` only if you must bypass a hook.
