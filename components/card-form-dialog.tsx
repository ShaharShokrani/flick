"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDeck } from "@/lib/deck-context";
import type { Flashcard } from "@/lib/types";

type CardFormDialogProps = {
  card?: Flashcard | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerClassName?: string;
  triggerLabel?: string;
  trigger?: ReactNode;
};

export function CardFormDialog({
  card,
  open,
  onOpenChange,
  triggerClassName,
  triggerLabel = "Add a word",
  trigger,
}: CardFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const dialogOpen = isControlled ? open : internalOpen;

  function setOpen(next: boolean) {
    if (!isControlled) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setOpen}>
      {trigger !== undefined ? (
        trigger
      ) : !isControlled ? (
        <DialogTrigger
          render={
            <Button className={triggerClassName}>
              <Plus data-icon="inline-start" />
              {triggerLabel}
            </Button>
          }
        />
      ) : null}
      <DialogContent className="sm:max-w-md">
        {dialogOpen ? (
          <CardForm
            key={card?.id ?? "new"}
            card={card}
            onDone={() => setOpen(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CardForm({
  card,
  onDone,
}: {
  card?: Flashcard | null;
  onDone: () => void;
}) {
  const { addCard, updateCard } = useDeck();
  const editing = Boolean(card);
  const [word, setWord] = useState(card?.word ?? "");
  const [translation, setTranslation] = useState(card?.translation ?? "");
  const [example, setExample] = useState(card?.example ?? "");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextWord = word.trim();
    const nextTranslation = translation.trim();

    if (!nextWord || !nextTranslation) {
      setError("Add the word and its English translation.");
      return;
    }

    try {
      if (card) {
        await updateCard({
          id: card.id,
          word: nextWord,
          translation: nextTranslation,
          example: example.trim(),
        });
      } else {
        await addCard({
          word: nextWord,
          translation: nextTranslation,
          example: example.trim(),
        });
      }
      onDone();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save that card. Try again."
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{editing ? "Edit flashcard" : "New flashcard"}</DialogTitle>
        <DialogDescription>
          {editing
            ? "Change the word, English meaning, or example. Review history stays."
            : "Save a word, the English meaning, and an example if you have one."}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="word">Word</Label>
          <Input
            id="word"
            value={word}
            onChange={(event) => setWord(event.target.value)}
            placeholder="bonjour"
            autoComplete="off"
            autoFocus
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="translation">English translation</Label>
          <Input
            id="translation"
            value={translation}
            onChange={(event) => setTranslation(event.target.value)}
            placeholder="hello"
            autoComplete="off"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="example">
            Example{" "}
            <span className="font-normal text-muted-foreground">optional</span>
          </Label>
          <Textarea
            id="example"
            value={example}
            onChange={(event) => setExample(event.target.value)}
            placeholder="Bonjour, comment ça va ?"
            rows={3}
          />
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <DialogFooter>
        <Button type="submit" className="w-full sm:w-auto">
          {editing ? "Save changes" : "Save card"}
        </Button>
      </DialogFooter>
    </form>
  );
}
