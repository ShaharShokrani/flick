# Flick — durable product facts

Edit this file when product rules change. `scripts/update-memory.mjs`
copies it into the generated snapshot.

## What it is

A browser flashcard app. The user adds a word, the English translation,
and an optional example, then reviews unread cards.

Words for signed-in users live in cloud Postgres (`DATABASE_URL`),
not on the phone or computer. Sign in with Google, email, or guest.
Guest gets an 8-character code (`XXXX-XXXX`). Unsigned-in visitors
see sample cards only. Localhost `data/cards.json` is still used by
the agent upload API when nobody is signed in.

## Learning rules

- Each day, Start learning only deals cards whose `dueAt` is today or
  earlier.
- Each card randomly starts from the word or the English. The learner
  flips it to see the other side and the example.
- **Yes** (`reviewCard(card, true)`): interval goes 1 day, then 3, then
  7, then `round(interval * ease)`. The card is due on that later day.
- **No** (`reviewCard(card, false)`): interval resets to 1 day, ease
  drops a little, and the card is due tomorrow — not again this session.
- Tap flips the card. Swipe right is Yes, swipe left is No. Space /
  Enter flips. `Y` / `N` also answer. Desktop still has Yes/No buttons.
- The app is a PWA (`app/manifest.ts`) so Android Chrome can Add to
  Home screen and run it fullscreen.
- Public site: https://temporary-brisk-mesa-ty777ur.vercel.app/
  That Vercel project is claimed. New commits reach it when the GitHub
  repo `ShaharShokrani/flick` is connected to the project, or when
  `VERCEL_TOKEN` + `VERCEL_ORG_ID` are set (`npm run deploy` /
  `.githooks/pre-push`).
- New cards are due today. `--known` on upload schedules the first
  review for tomorrow.
- Words live on `/words`, not the home screen. Each word is editable
  and shows a % of how well it is known from Yes/No reviews.

## Stack

Next.js App Router, React, TypeScript, Tailwind, shadcn/ui. Dev server
port `43147`.

## Surfaces

- `/` — deck stats and start learning
- `/words` — add, edit, and delete cards, with a knowledge %
- `/learn` — one-pass Yes/No session
- Sign in — Google (if configured), email + password, or guest code
- `POST /api/cards` — agent or CLI upload of a word (localhost file, or the signed-in user)
- `GET /api/cards?learned=1` — words the current deck already knows

## Agent upload

When a word is learned with the local user, add it with
`npm run add-word -- --word <word> --translation <english> --example <sentence> --known`.
The same word is upserted. `--known` marks it already learned.
