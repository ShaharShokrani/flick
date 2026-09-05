# Flick — durable product facts

Edit this file when product rules change. `scripts/update-memory.mjs`
copies it into the generated snapshot.

## What it is

A browser flashcard app. The user adds a word, the English translation,
and an optional example, then reviews unread cards.

There is no account. The local user's deck is `data/cards.json`, exposed
at `/api/cards`. The browser keeps a `localStorage` cache and polls the
API so agent uploads show up without a refresh.

## Learning rules

- Each day, Start learning only deals cards whose `dueAt` is today or
  earlier.
- Each card randomly starts from the word or the English. The learner
  flips it to see the other side and the example.
- **Yes** (`reviewCard(card, true)`): interval goes 1 day, then 3, then
  7, then `round(interval * ease)`. The card is due on that later day.
- **No** (`reviewCard(card, false)`): interval resets to 1 day, ease
  drops a little, and the card is due tomorrow — not again this session.
- Space / Enter flips. `Y` / `N` answer after a flip.
- New cards are due today. `--known` on upload schedules the first
  review for tomorrow.

## Stack

Next.js App Router, React, TypeScript, Tailwind, shadcn/ui. Dev server
port `43147`.

## Surfaces

- `/` — deck stats, add/delete cards, start learning
- `/learn` — one-pass Yes/No session
- `POST /api/cards` — agent or CLI upload of a word
- `GET /api/cards?learned=1` — words the local user already knows

## Agent upload

When a word is learned with the local user, add it with
`npm run add-word -- --word <word> --translation <english> --example <sentence> --known`.
The same word is upserted. `--known` marks it already learned.
