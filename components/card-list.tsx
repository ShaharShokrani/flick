"use client";

import { useState } from "react";
import { Check, Pencil, Trash2 } from "lucide-react";

import { CardFormDialog } from "@/components/card-form-dialog";
import { KnowledgeMeter } from "@/components/knowledge-meter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeck } from "@/lib/deck-context";
import { formatDue, isDue, knowledgePercent } from "@/lib/schedule";
import type { Flashcard } from "@/lib/types";

export function CardList() {
  const { cards, deleteCard } = useDeck();
  const [editing, setEditing] = useState<Flashcard | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Flashcard | null>(null);

  if (cards.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/60 px-5 py-12 text-center">
        <p className="font-medium">No cards yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a word and its English translation to start a deck.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="grid gap-3">
        {sortByDue(cards).map((card) => {
          const known = knowledgePercent(card);
          return (
            <li key={card.id}>
              <div className="flex items-stretch gap-2 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-foreground/8 sm:p-4">
                <button
                  type="button"
                  onClick={() => setEditing(card)}
                  className="flex min-w-0 flex-1 items-start gap-3 rounded-xl px-1 py-0.5 text-left hover:bg-foreground/4"
                >
                  <KnowledgeMeter value={known} word={card.word} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-serif text-xl leading-tight tracking-tight">
                        {card.word}
                      </p>
                      {isDue(card) ? (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-900 ring-1 ring-amber-200">
                          Due today
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 ring-1 ring-emerald-200">
                          <Check className="size-3" />
                          {formatDue(card)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {card.translation}
                    </p>
                    {card.example ? (
                      <p className="mt-2 text-sm leading-6 text-foreground/80">
                        {card.example}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {known === 0
                        ? "Not reviewed yet"
                        : `${known}% known · tap to edit`}
                    </p>
                  </div>
                </button>
                <div className="flex shrink-0 flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${card.word}`}
                    onClick={() => setEditing(card)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${card.word}`}
                    onClick={() => setPendingDelete(card)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <CardFormDialog
        card={editing}
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
          }
        }}
      />

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this card?</DialogTitle>
            <DialogDescription>
              {pendingDelete
                ? `“${pendingDelete.word}” will be removed from your deck.`
                : "This card will be removed from your deck."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Keep it
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingDelete) {
                  deleteCard(pendingDelete.id);
                }
                setPendingDelete(null);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function sortByDue(cards: Flashcard[]) {
  return [...cards].sort((left, right) => {
    const leftDue = isDue(left) ? 0 : 1;
    const rightDue = isDue(right) ? 0 : 1;
    if (leftDue !== rightDue) {
      return leftDue - rightDue;
    }
    return (left.dueAt ?? 0) - (right.dueAt ?? 0);
  });
}
