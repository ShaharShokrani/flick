"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  addCard as addCardToStore,
  deleteCard as deleteCardFromStore,
  getClientSnapshot,
  getServerSnapshot,
  markKnown as markKnownInStore,
  resetKnown as resetKnownInStore,
  subscribe,
} from "@/lib/deck-store";
import type { Flashcard } from "@/lib/types";

type AddCardInput = {
  word: string;
  translation: string;
  example: string;
  known?: boolean;
};

type DeckContextValue = {
  cards: Flashcard[];
  toLearn: Flashcard[];
  knownCount: number;
  addCard: (input: AddCardInput) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  markKnown: (id: string) => Promise<void>;
  resetKnown: () => Promise<void>;
};

const DeckContext = createContext<DeckContextValue | null>(null);

export function DeckProvider({ children }: { children: ReactNode }) {
  const cards = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  const value = useMemo<DeckContextValue>(() => {
    const toLearn = cards.filter((card) => !card.known);
    return {
      cards,
      toLearn,
      knownCount: cards.length - toLearn.length,
      addCard: async (input) => {
        await addCardToStore(input);
      },
      deleteCard: async (id) => {
        await deleteCardFromStore(id);
      },
      markKnown: async (id) => {
        await markKnownInStore(id);
      },
      resetKnown: async () => {
        await resetKnownInStore();
      },
    };
  }, [cards]);

  return <DeckContext.Provider value={value}>{children}</DeckContext.Provider>;
}

export function useDeck() {
  const context = useContext(DeckContext);
  if (!context) {
    throw new Error("useDeck must be used within DeckProvider");
  }
  return context;
}
