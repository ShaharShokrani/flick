# Flick

A tiny flashcard app for the web and Android. Add a word, the English translation, and an optional example. Then flip through your deck and **swipe right for Yes**, **swipe left for No**.

- **Yes** — you know it. The next review waits longer: 1 day, then 3, then 7, then further apart.
- **No** — you do not know it. It leaves this session and comes back tomorrow.

Sign in with Google, email, or a guest code so the same deck follows you
from computer to phone. Without sign-in, localhost still uses
`data/cards.json` and the public site keeps words in the phone browser.

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

## Sign in and sync

1. Copy `.env.example` to `.env.local`.
2. Set `BETTER_AUTH_SECRET` to a long random string.
3. For phone + computer, create a free [Neon](https://neon.tech) Postgres database and put the same `DATABASE_URL` in `.env.local` **and** in the Vercel project env vars. Also set `BETTER_AUTH_URL` to `https://temporary-brisk-mesa-ty777ur.vercel.app` on Vercel.
4. Optional: add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. The Google redirect URL is `{BETTER_AUTH_URL}/api/auth/callback/google`.

Then tap **Sign in**:

- **Google** — if those env vars are set.
- **Email** — create an account on one device, sign in with the same email on the other.
- **Guest** — get an 8-character code (`XXXX-XXXX`) and enter it on the phone.

Local `npm run dev` can run without `DATABASE_URL` (it uses `data/pglite`). That local database is not the phone. Use the same Neon URL on both sides to share words.

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

On the public site without sign-in, cards stay in the phone’s browser. The `data/cards.json` API is for unsigned-in localhost use and agent uploads.

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
