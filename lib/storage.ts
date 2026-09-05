import { isFlashcard, SAMPLE_CARDS } from "@/lib/card-model";
import { normalizeCard } from "@/lib/schedule";
import type { Flashcard } from "@/lib/types";

export const STORAGE_KEY = "flick-cards-v1";
export const MIGRATED_KEY = "flick-migrated-to-file-v1";

export { SAMPLE_CARDS };

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

    return parsed.filter(isFlashcard).map((card) => normalizeCard(card));
  } catch {
    return [];
  }
}

export function saveCards(cards: Flashcard[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

export function hasMigratedLocalDeck() {
  return window.localStorage.getItem(MIGRATED_KEY) === "1";
}

export function markLocalDeckMigrated() {
  window.localStorage.setItem(MIGRATED_KEY, "1");
}

export function canUseLocalApi() {
  if (typeof window === "undefined") {
    return false;
  }
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}
