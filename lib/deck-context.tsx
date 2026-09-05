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
  updateCard as updateCardInStore,
  getClientSnapshot,
  getServerSnapshot,
  resetKnown as resetKnownInStore,
  review as reviewInStore,
  subscribe,
} from "@/lib/deck-store";
import { dueCards, formatNextReview, nextDueAt } from "@/lib/schedule";
import type { Flashcard } from "@/lib/types";

type AddCardInput = {
  word: string;
  translation: string;
  example: string;
  known?: boolean;
};

type EditCardInput = {
  id: string;
  word: string;
  translation: string;
  example: string;
};

type DeckContextValue = {
  cards: Flashcard[];
  toLearn: Flashcard[];
  knownCount: number;
  upcomingCount: number;
  nextReviewLabel: string | null;
  addCard: (input: AddCardInput) => Promise<void>;
  updateCard: (input: EditCardInput) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  markKnown: (id: string) => Promise<void>;
  markForgotten: (id: string) => Promise<void>;
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
    const toLearn = dueCards(cards);
    const nextAt = nextDueAt(cards);
    return {
      cards,
      toLearn,
      knownCount: cards.filter((card) => card.known).length,
      upcomingCount: cards.length - toLearn.length,
      nextReviewLabel: nextAt ? formatNextReview(nextAt) : null,
      addCard: async (input) => {
        await addCardToStore(input);
      },
      updateCard: async (input) => {
        await updateCardInStore(input);
      },
      deleteCard: async (id) => {
        await deleteCardFromStore(id);
      },
      markKnown: async (id) => {
        await reviewInStore(id, true);
      },
      markForgotten: async (id) => {
        await reviewInStore(id, false);
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
