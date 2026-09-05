import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import {
  editCard,
  parseCards,
  SAMPLE_CARDS,
  upsertCard,
  type AddCardInput,
  type EditCardInput,
} from "@/lib/card-model";
import { normalizeCard, resetSchedule, reviewCard } from "@/lib/schedule";
import type { Flashcard } from "@/lib/types";

export const CARDS_FILE = join(process.cwd(), "data", "cards.json");

type DeckFile = {
  cards: Flashcard[];
};

export function readDeck(): Flashcard[] {
  try {
    const raw = readFileSync(CARDS_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    const cards = parseCards(
      parsed && typeof parsed === "object" && "cards" in parsed
        ? (parsed as DeckFile).cards
        : parsed
    );
    return cards.map((card) => normalizeCard(card));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      writeDeck(SAMPLE_CARDS);
      return SAMPLE_CARDS;
    }
    return SAMPLE_CARDS;
  }
}

export function writeDeck(cards: Flashcard[]) {
  try {
    mkdirSync(dirname(CARDS_FILE), { recursive: true });
    const payload: DeckFile = { cards };
    writeFileSync(CARDS_FILE, `${JSON.stringify(payload, null, 2)}\n`);
  } catch {
    // Hosts like Vercel have a read-only filesystem. The phone app
    // keeps the deck in localStorage instead.
  }
}

export function addCardToDeck(input: AddCardInput) {
  const current = readDeck();
  const next = upsertCard(current, input);
  writeDeck(next.cards);
  return next;
}

export function updateCardInDeck(input: EditCardInput) {
  const result = editCard(readDeck(), input);
  if ("error" in result) {
    return result;
  }
  writeDeck(result.cards);
  return result;
}

export function reviewCardInDeck(id: string, remembered: boolean) {
  const cards = readDeck();
  const current = cards.find((card) => card.id === id);
  if (!current) {
    return null;
  }
  const next = cards.map((card) =>
    card.id === id ? reviewCard(card, remembered) : card
  );
  writeDeck(next);
  return { cards: next, card: next.find((card) => card.id === id) };
}

export function resetDeckSchedule() {
  const cards = readDeck().map((card) => resetSchedule(card));
  writeDeck(cards);
  return cards;
}
