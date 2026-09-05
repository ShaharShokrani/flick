#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cardsPath = join(root, "data", "cards.json");
const defaultUrl = process.env.FLICK_URL ?? "http://127.0.0.1:43147";

function printHelp() {
  console.log(`Add a word to the local Flick deck.

Usage:
  npm run add-word -- <word> <english> [example]
  npm run add-word -- --word haus --translation house --example "Das Haus ist groß." --known

Flags:
  --word, --translation|--english, --example, --known/--learned
  --url   Flick origin (default ${defaultUrl})

If the app is running, the word is POSTed to /api/cards so the open
browser updates. If it is not, the word is written to data/cards.json.
`);
}

function readArg(args, name, fallbackNames = []) {
  const names = [name, ...fallbackNames];
  for (const flag of names) {
    const index = args.indexOf(flag);
    if (index !== -1 && args[index + 1]) {
      return args[index + 1];
    }
  }
  return "";
}

function hasFlag(args, name) {
  return args.includes(name);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    return { help: true };
  }

  const positional = argv.filter((arg) => !arg.startsWith("--"));
  const word = readArg(argv, "--word") || positional[0] || "";
  const translation =
    readArg(argv, "--translation", ["--english", "--en"]) ||
    positional[1] ||
    "";
  const example = readArg(argv, "--example") || positional.slice(2).join(" ");
  const known = hasFlag(argv, "--known") || hasFlag(argv, "--learned");
  const url = readArg(argv, "--url") || defaultUrl;

  if (!word || !translation) {
    return { error: "Need a word and an English translation." };
  }

  return {
    word,
    translation,
    example,
    known,
    url: url.replace(/\/$/, ""),
  };
}

function loadDeck() {
  try {
    const parsed = JSON.parse(readFileSync(cardsPath, "utf8"));
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (parsed && Array.isArray(parsed.cards)) {
      return parsed.cards;
    }
    return [];
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

function writeDeck(cards) {
  mkdirSync(dirname(cardsPath), { recursive: true });
  writeFileSync(cardsPath, `${JSON.stringify({ cards }, null, 2)}\n`);
}

function upsertLocal({ word, translation, example, known }) {
  const cards = loadDeck();
  const key = word.trim().toLocaleLowerCase();
  const existing = cards.find(
    (card) => String(card.word).trim().toLocaleLowerCase() === key
  );
  const card = existing
    ? {
        ...existing,
        word,
        translation,
        example: example || existing.example,
        known: known || existing.known,
      }
    : {
        id: randomUUID(),
        word,
        translation,
        example,
        known,
        createdAt: Date.now(),
      };

  const next = existing
    ? cards.map((item) => (item.id === existing.id ? card : item))
    : [card, ...cards];
  writeDeck(next);
  return { card, created: !existing };
}

const parsed = parseArgs(process.argv.slice(2));
if (parsed.help) {
  printHelp();
  process.exit(0);
}
if (parsed.error) {
  console.error(parsed.error);
  printHelp();
  process.exit(1);
}

const payload = {
  word: parsed.word,
  translation: parsed.translation,
  example: parsed.example,
  known: parsed.known,
};

try {
  const response = await fetch(`${parsed.url}/api/cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  const status = data.created ? "added" : "updated";
  console.log(`${status} "${data.card.word}" → ${data.card.translation}`);
  if (data.card.known) {
    console.log("marked as known");
  }
} catch {
  const { card, created } = upsertLocal(payload);
  const status = created ? "added" : "updated";
  console.log(
    `${status} "${card.word}" → ${card.translation} in data/cards.json (app was not reachable at ${parsed.url})`
  );
}
