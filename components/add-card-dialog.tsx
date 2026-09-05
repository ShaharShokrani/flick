"use client";

import { useState, type FormEvent } from "react";
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

type AddCardDialogProps = {
  triggerClassName?: string;
  triggerLabel?: string;
};

export function AddCardDialog({
  triggerClassName,
  triggerLabel = "Add a word",
}: AddCardDialogProps) {
  const { addCard } = useDeck();
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [example, setExample] = useState("");
  const [error, setError] = useState("");

  function resetForm() {
    setWord("");
    setTranslation("");
    setExample("");
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextWord = word.trim();
    const nextTranslation = translation.trim();

    if (!nextWord || !nextTranslation) {
      setError("Add the word and its English translation.");
      return;
    }

    try {
      await addCard({
        word: nextWord,
        translation: nextTranslation,
        example: example.trim(),
      });
      resetForm();
      setOpen(false);
    } catch {
      setError("Could not save that card. Try again.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          resetForm();
        }
      }}
    >
      <DialogTrigger
        render={
          <Button className={triggerClassName}>
            <Plus data-icon="inline-start" />
            {triggerLabel}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>New flashcard</DialogTitle>
            <DialogDescription>
              Save a word, the English meaning, and an example if you have one.
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
                <span className="font-normal text-muted-foreground">
                  optional
                </span>
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
              Save card
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
