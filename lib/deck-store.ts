"use client";

import { upsertCard } from "@/lib/card-model";
import { resetSchedule, reviewCard } from "@/lib/schedule";
import {
  hasMigratedLocalDeck,
  loadCards,
  markLocalDeckMigrated,
  SAMPLE_CARDS,
  saveCards,
} from "@/lib/storage";
import type { Flashcard } from "@/lib/types";

type AddCardInput = {
  word: string;
  translation: string;
  example: string;
  known?: boolean;
};

let state: Flashcard[] | null = null;
const listeners = new Set<() => void>();
let started = false;

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function replace(cards: Flashcard[]) {
  state = cards;
  saveCards(cards);
  emit();
}

async function fetchCards(query = "") {
  const response = await fetch(`/api/cards${query}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Could not load cards.");
  }
  const data = (await response.json()) as { cards?: Flashcard[] };
  return Array.isArray(data.cards) ? data.cards : [];
}

function sameDeck(left: Flashcard[], right: Flashcard[]) {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((card, index) => {
    const other = right[index];
    return (
      card.id === other.id &&
      card.word === other.word &&
      card.translation === other.translation &&
      card.example === other.example &&
      card.known === other.known &&
      card.dueAt === other.dueAt &&
      card.intervalDays === other.intervalDays
    );
  });
}

async function migrateLocalCards(remote: Flashcard[]) {
  if (hasMigratedLocalDeck()) {
    return remote;
  }

  let cards = remote;
  const local = loadCards().filter((card) => !card.id.startsWith("sample-"));
  for (const card of local) {
    const already = cards.some(
      (item) => item.word.toLocaleLowerCase() === card.word.toLocaleLowerCase()
    );
    if (already) {
      continue;
    }
    const response = await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        word: card.word,
        translation: card.translation,
        example: card.example,
        known: card.known,
      }),
    });
    if (response.ok) {
      const data = (await response.json()) as { cards?: Flashcard[] };
      if (Array.isArray(data.cards)) {
        cards = data.cards;
      }
    }
  }

  markLocalDeckMigrated();
  return cards;
}

async function refreshCards() {
  try {
    const remote = await fetchCards();
    if (state && sameDeck(state, remote)) {
      return;
    }
    replace(remote);
  } catch {
    // Keep the last local snapshot if the API is briefly down.
  }
}

async function bootstrap() {
  try {
    const remote = await fetchCards();
    replace(await migrateLocalCards(remote));
  } catch {
    if (state === null) {
      replace(loadCards());
    }
  }
}

function start() {
  if (started || typeof window === "undefined") {
    return;
  }
  started = true;
  void bootstrap();
  window.setInterval(() => {
    void refreshCards();
  }, 2000);
  window.addEventListener("focus", () => {
    void refreshCards();
  });
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  start();
  return () => {
    listeners.delete(listener);
  };
}

export function getClientSnapshot() {
  if (state === null) {
    state = loadCards();
    start();
  }
  return state;
}

export function getServerSnapshot() {
  return SAMPLE_CARDS;
}

export async function addCard(input: AddCardInput) {
  const response = await fetch("/api/cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const fallback = upsertCard(getClientSnapshot(), input);
    replace(fallback.cards);
    return fallback.card;
  }
  const data = (await response.json()) as {
    card?: Flashcard;
    cards?: Flashcard[];
  };
  if (Array.isArray(data.cards)) {
    replace(data.cards);
  }
  return data.card;
}

export async function deleteCard(id: string) {
  const response = await fetch(`/api/cards?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (response.ok) {
    const data = (await response.json()) as { cards?: Flashcard[] };
    if (Array.isArray(data.cards)) {
      replace(data.cards);
      return;
    }
  }
  replace(getClientSnapshot().filter((card) => card.id !== id));
}

export async function review(id: string, remembered: boolean) {
  const response = await fetch("/api/cards", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, remembered }),
  });
  if (response.ok) {
    const data = (await response.json()) as { cards?: Flashcard[] };
    if (Array.isArray(data.cards)) {
      replace(data.cards);
      return;
    }
  }
  replace(
    getClientSnapshot().map((card) =>
      card.id === id ? reviewCard(card, remembered) : card
    )
  );
}

export async function markKnown(id: string) {
  return review(id, true);
}

export async function resetKnown() {
  const response = await fetch("/api/cards", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resetSchedule: true }),
  });
  if (response.ok) {
    const data = (await response.json()) as { cards?: Flashcard[] };
    if (Array.isArray(data.cards)) {
      replace(data.cards);
      return;
    }
  }
  replace(getClientSnapshot().map((card) => resetSchedule(card)));
}

