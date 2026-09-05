import type { Flashcard } from "@/lib/types";

export const STORAGE_KEY = "flick-cards-v1";

const SAMPLE_CARDS: Flashcard[] = [
  {
    id: "sample-bonjour",
    word: "bonjour",
    translation: "hello",
    example: "Bonjour, comment ça va ?",
    known: false,
    createdAt: 1,
  },
  {
    id: "sample-gato",
    word: "gato",
    translation: "cat",
    example: "El gato duerme en el sofá.",
    known: false,
    createdAt: 2,
  },
  {
    id: "sample-danke",
    word: "danke",
    translation: "thank you",
    example: "Danke für deine Hilfe.",
    known: false,
    createdAt: 3,
  },
  {
    id: "sample-acqua",
    word: "acqua",
    translation: "water",
    example: "Vorrei un bicchiere d'acqua.",
    known: false,
    createdAt: 4,
  },
];

export function loadCards(): Flashcard[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return SAMPLE_CARDS;
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isFlashcard);
  } catch {
    return [];
  }
}

export function saveCards(cards: Flashcard[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

function isFlashcard(value: unknown): value is Flashcard {
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
