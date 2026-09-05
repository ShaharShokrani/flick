# Flick — durable product facts

Edit this file when product rules change. `scripts/update-memory.mjs`
copies it into the generated snapshot.

## What it is

A browser flashcard app. The user adds a word, the English translation,
and an optional example, then reviews unread cards.

There is no account, database, or API. The deck lives in `localStorage`
under `flick-cards-v1`.

## Learning rules

- A session starts with every card that is not `known`, shuffled once.
- The card shows the word first. The learner flips it to see English and
  the example.
- **Yes** calls `markKnown`. That card stays out of later sessions until
  `resetKnown`.
- **No** removes the card from the current queue only. It comes back the
  next time the user starts learning.
- Space / Enter flips. `Y` / `N` answer after a flip.

## Stack

Next.js App Router, React, TypeScript, Tailwind, shadcn/ui. Dev server
port `43147`.

## Surfaces

- `/` — deck stats, add/delete cards, start learning
- `/learn` — one-pass Yes/No session
