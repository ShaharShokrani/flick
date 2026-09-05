# Flick

A tiny flashcard app. Add a word, the English translation, and an optional example. Then flip through your deck and tap **Yes** or **No**.

- **Yes** — you know it. The next review waits longer: 1 day, then 3, then 7, then further apart.
- **No** — you do not know it. It leaves this session and comes back tomorrow.

Cards are saved on this machine in `data/cards.json`. The browser keeps a
cache and picks up new words automatically. There is no account.

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

1. Add words from the home screen.
2. Start learning. Only cards due today are shown. Each card starts from the word or the English at random — tap to see the other side and the example.
3. Choose Yes or No. Yes schedules a later day. No comes back tomorrow.

The first visit includes a few sample words so you can try the flow immediately.

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
