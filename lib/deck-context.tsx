"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  getClientSnapshot,
  getServerSnapshot,
  subscribe,
  updateCards,
} from "@/lib/deck-store";
import type { Flashcard } from "@/lib/types";

type AddCardInput = {
  word: string;
  translation: string;
  example: string;
};

type DeckContextValue = {
  ready: boolean;
  cards: Flashcard[];
  toLearn: Flashcard[];
  knownCount: number;
  addCard: (input: AddCardInput) => void;
  deleteCard: (id: string) => void;
  markKnown: (id: string) => void;
  resetKnown: () => void;
};

const DeckContext = createContext<DeckContextValue | null>(null);

export function DeckProvider({ children }: { children: ReactNode }) {
  const cards = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const value = useMemo<DeckContextValue>(() => {
    const toLearn = cards.filter((card) => !card.known);
    return {
      ready,
      cards: ready ? cards : [],
      toLearn: ready ? toLearn : [],
      knownCount: ready ? cards.length - toLearn.length : 0,
      addCard: ({ word, translation, example }) => {
        const next: Flashcard = {
          id: crypto.randomUUID(),
          word: word.trim(),
          translation: translation.trim(),
          example: example.trim(),
          known: false,
          createdAt: Date.now(),
        };
        updateCards((current) => [next, ...current]);
      },
      deleteCard: (id) => {
        updateCards((current) => current.filter((card) => card.id !== id));
      },
      markKnown: (id) => {
        updateCards((current) =>
          current.map((card) =>
            card.id === id ? { ...card, known: true } : card
          )
        );
      },
      resetKnown: () => {
        updateCards((current) =>
          current.map((card) => ({ ...card, known: false }))
        );
      },
    };
  }, [cards, ready]);

  return <DeckContext.Provider value={value}>{children}</DeckContext.Provider>;
}

export function useDeck() {
  const context = useContext(DeckContext);
  if (!context) {
    throw new Error("useDeck must be used within DeckProvider");
  }
  return context;
}
