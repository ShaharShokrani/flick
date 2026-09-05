"use client";

import type { Flashcard as FlashcardType } from "@/lib/types";
import { cn } from "@/lib/utils";

export type PromptSide = "word" | "english";

type FlashcardProps = {
  card: FlashcardType;
  prompt: PromptSide;
  flipped: boolean;
  onFlip: () => void;
};

export function Flashcard({ card, prompt, flipped, onFlip }: FlashcardProps) {
  const startsFromEnglish = prompt === "english";
  const frontLabel = startsFromEnglish ? "English" : "Word";
  const frontText = startsFromEnglish ? card.translation : card.word;
  const backLabel = startsFromEnglish ? "Word" : "English";
  const backText = startsFromEnglish ? card.word : card.translation;
  const tapHint = startsFromEnglish
    ? "Tap to see the word"
    : "Tap to see the English";

  return (
    <button
      type="button"
      onClick={onFlip}
      aria-pressed={flipped}
      className="group block w-full text-left [perspective:1400px]"
    >
      <span className="sr-only">
        {flipped ? `Hide the ${backLabel.toLowerCase()}` : tapHint}
      </span>
      <div
        className={cn(
          "relative min-h-[280px] w-full transition-transform duration-500 [transform-style:preserve-3d] sm:min-h-[320px]",
          flipped && "[transform:rotateY(180deg)]"
        )}
      >
        <div
          aria-hidden={flipped}
          className="absolute inset-0 flex flex-col justify-between rounded-[1.75rem] bg-card px-6 py-7 shadow-[0_18px_50px_-24px_rgba(62,36,16,0.45)] ring-1 ring-foreground/10 [backface-visibility:hidden]"
        >
          <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
            {frontLabel}
          </p>
          <p className="font-serif text-4xl leading-tight tracking-tight text-balance sm:text-5xl">
            {frontText}
          </p>
          <p className="text-sm text-muted-foreground">{tapHint}</p>
        </div>

        <div
          aria-hidden={!flipped}
          className="absolute inset-0 flex flex-col justify-between rounded-[1.75rem] bg-[oklch(0.35_0.04_55)] px-6 py-7 text-[oklch(0.97_0.01_85)] shadow-[0_18px_50px_-24px_rgba(62,36,16,0.45)] [backface-visibility:hidden] [transform:rotateY(180deg)]"
        >
          <p className="text-[11px] font-medium tracking-[0.18em] text-white/60 uppercase">
            {backLabel}
          </p>
          <div className="space-y-3">
            <p className="font-serif text-4xl leading-tight tracking-tight text-balance sm:text-5xl">
              {backText}
            </p>
            {card.example ? (
              <p className="max-w-md text-sm leading-6 text-white/75">
                {card.example}
              </p>
            ) : (
              <p className="text-sm text-white/50">No example saved</p>
            )}
          </div>
          <p className="text-sm text-white/55">Do you know this word?</p>
        </div>
      </div>
    </button>
  );
}
