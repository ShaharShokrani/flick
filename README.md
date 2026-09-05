# Flick

A tiny flashcard app. Add a word, the English translation, and an optional example. Then flip through your deck and tap **Yes** or **No**.

- **Yes** — you know it. The card is marked known and stays out of later sessions.
- **No** — you do not know it. It leaves this session and will not keep coming back until you start learning again.

Cards are saved in your browser (`localStorage`). There is no account.

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
2. Start learning. Each card shows the word first — tap to see English and the example.
3. Choose Yes or No. The session ends when every remaining card has been answered.

The first visit includes a few sample words so you can try the flow immediately.
