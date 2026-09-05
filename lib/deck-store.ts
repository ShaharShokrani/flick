import { loadCards, SAMPLE_CARDS, saveCards } from "@/lib/storage";
import type { Flashcard } from "@/lib/types";
let state: Flashcard[] | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getClientSnapshot() {
  if (state === null) {
    state = loadCards();
  }
  return state;
}

export function getServerSnapshot() {
  return SAMPLE_CARDS;
}

export function updateCards(updater: (cards: Flashcard[]) => Flashcard[]) {
  state = updater(getClientSnapshot());
  saveCards(state);
  emit();
}
