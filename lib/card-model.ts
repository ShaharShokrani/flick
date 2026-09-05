import { normalizeCard, scheduleNewCard } from "@/lib/schedule";
import type { Flashcard } from "@/lib/types";

const NEW_SCHEDULE = {
  known: false,
  dueAt: 0,
  intervalDays: 0,
  repetitions: 0,
  ease: 2.5,
} as const;

export const SAMPLE_CARDS: Flashcard[] = [
  {
    id: "sample-bonjour",
    word: "bonjour",
    translation: "hello",
    example: "Bonjour, comment ça va ?",
    createdAt: 1,
    ...NEW_SCHEDULE,
  },
  {
    id: "sample-gato",
    word: "gato",
    translation: "cat",
    example: "El gato duerme en el sofá.",
    createdAt: 2,
    ...NEW_SCHEDULE,
  },
  {
    id: "sample-danke",
    word: "danke",
    translation: "thank you",
    example: "Danke für deine Hilfe.",
    createdAt: 3,
    ...NEW_SCHEDULE,
  },
  {
    id: "sample-acqua",
    word: "acqua",
    translation: "water",
    example: "Vorrei un bicchiere d'acqua.",
    createdAt: 4,
    ...NEW_SCHEDULE,
  },
];

export type AddCardInput = {
  word: string;
  translation: string;
  example?: string;
  known?: boolean;
};

export function isFlashcard(value: unknown): value is Flashcard {
  if (!value || typeof value !== "object") {
    return false;
  }

  const card = value as Record<string, unknown>;
  return (
    typeof card.id === "string" &&
    typeof card.word === "string" &&
    typeof card.translation === "string" &&
    typeof card.example === "string" &&
    typeof card.known === "boolean" &&
    typeof card.createdAt === "number"
  );
}

export function parseCards(value: unknown): Flashcard[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isFlashcard).map((card) => normalizeCard(card));
}

export function normalizeWord(word: string) {
  return word.trim().toLocaleLowerCase();
}

export function createCard(input: AddCardInput): Flashcard {
  return {
    id: crypto.randomUUID(),
    word: input.word.trim(),
    translation: input.translation.trim(),
    example: input.example?.trim() ?? "",
    createdAt: Date.now(),
    ...scheduleNewCard(Boolean(input.known)),
  };
}

export function upsertCard(
  cards: Flashcard[],
  input: AddCardInput
): { cards: Flashcard[]; card: Flashcard; created: boolean } {
  const word = input.word.trim();
  const translation = input.translation.trim();
  const example = input.example?.trim() ?? "";
  const key = normalizeWord(word);
  const existing = cards.find((card) => normalizeWord(card.word) === key);

  if (existing) {
    let card: Flashcard = {
      ...normalizeCard(existing),
      word,
      translation,
      example: example || existing.example,
    };
    if (input.known === true && !existing.known) {
      card = { ...card, ...scheduleNewCard(true) };
    }
    if (input.known === false && existing.known) {
      card = { ...card, ...scheduleNewCard(false) };
    }
    return {
      card,
      created: false,
      cards: cards.map((item) => (item.id === existing.id ? card : item)),
    };
  }

  const card = createCard({ word, translation, example, known: input.known });
  return { card, created: true, cards: [card, ...cards] };
}

export function parseAddCardInput(value: unknown): AddCardInput | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const body = value as Record<string, unknown>;
  const word = typeof body.word === "string" ? body.word.trim() : "";
  const translation =
    typeof body.translation === "string"
      ? body.translation.trim()
      : typeof body.english === "string"
        ? body.english.trim()
        : "";
  const example = typeof body.example === "string" ? body.example : "";
  const known =
    body.known === true ||
    body.known === "true" ||
    body.learned === true ||
    body.learned === "true";

  if (!word || !translation) {
    return null;
  }

  return { word, translation, example, known };
}
