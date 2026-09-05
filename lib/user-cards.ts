import { eq } from "drizzle-orm";

import {
  editCard,
  upsertCard,
  type AddCardInput,
  type EditCardInput,
} from "@/lib/card-model";
import { getDb } from "@/lib/db";
import { card as cardTable } from "@/lib/db/schema";
import { normalizeCard, resetSchedule, reviewCard } from "@/lib/schedule";
import type { Flashcard } from "@/lib/types";

function toFlashcard(row: typeof cardTable.$inferSelect): Flashcard {
  return normalizeCard({
    id: row.id,
    word: row.word,
    translation: row.translation,
    example: row.example,
    known: row.known,
    createdAt: row.createdAt,
    dueAt: row.dueAt,
    intervalDays: row.intervalDays,
    repetitions: row.repetitions,
    ease: row.ease,
  });
}

function toRow(userId: string, card: Flashcard) {
  const current = normalizeCard(card);
  return {
    id: current.id,
    userId,
    word: current.word,
    translation: current.translation,
    example: current.example,
    known: current.known,
    createdAt: current.createdAt,
    dueAt: current.dueAt,
    intervalDays: current.intervalDays,
    repetitions: current.repetitions,
    ease: current.ease,
  };
}

export async function listUserCards(userId: string): Promise<Flashcard[]> {
  const rows = await getDb()
    .select()
    .from(cardTable)
    .where(eq(cardTable.userId, userId));
  return rows.map(toFlashcard);
}

export async function saveUserCards(userId: string, cards: Flashcard[]) {
  const db = getDb();
  await db.delete(cardTable).where(eq(cardTable.userId, userId));
  if (cards.length > 0) {
    await db.insert(cardTable).values(cards.map((item) => toRow(userId, item)));
  }
  return cards.map((item) => normalizeCard(item));
}

export async function addUserCard(userId: string, input: AddCardInput) {
  const current = await listUserCards(userId);
  const next = upsertCard(current, input);
  await saveUserCards(userId, next.cards);
  return next;
}

export async function updateUserCard(userId: string, input: EditCardInput) {
  const result = editCard(await listUserCards(userId), input);
  if ("error" in result) {
    return result;
  }
  await saveUserCards(userId, result.cards);
  return result;
}

export async function deleteUserCard(userId: string, id: string) {
  const cards = (await listUserCards(userId)).filter((item) => item.id !== id);
  await saveUserCards(userId, cards);
  return cards;
}

export async function reviewUserCard(
  userId: string,
  id: string,
  remembered: boolean
) {
  const cards = await listUserCards(userId);
  const current = cards.find((item) => item.id === id);
  if (!current) {
    return null;
  }
  const next = cards.map((item) =>
    item.id === id ? reviewCard(item, remembered) : item
  );
  await saveUserCards(userId, next);
  return { cards: next, card: next.find((item) => item.id === id) };
}

export async function resetUserSchedule(userId: string) {
  const cards = (await listUserCards(userId)).map((item) => resetSchedule(item));
  await saveUserCards(userId, cards);
  return cards;
}

export async function importUserCards(userId: string, incoming: Flashcard[]) {
  let cards = await listUserCards(userId);
  for (const card of incoming) {
    if (card.id.startsWith("sample-")) {
      continue;
    }
    cards = upsertCard(cards, {
      word: card.word,
      translation: card.translation,
      example: card.example,
      known: card.known,
    }).cards;
  }
  await saveUserCards(userId, cards);
  return cards;
}
