"use client";

import { Check, X } from "lucide-react";

import { useCardSwipe } from "@/hooks/use-card-swipe";
import type { Flashcard as FlashcardType } from "@/lib/types";
import { cn } from "@/lib/utils";

export type PromptSide = "word" | "english";

type FlashcardProps = {
  card: FlashcardType;
  prompt: PromptSide;
  flipped: boolean;
  onFlip: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
};

export function Flashcard({
  card,
  prompt,
  flipped,
  onFlip,
  onSwipeLeft,
  onSwipeRight,
}: FlashcardProps) {
  const startsFromEnglish = prompt === "english";
  const frontLabel = startsFromEnglish ? "English" : "Word";
  const frontText = startsFromEnglish ? card.translation : card.word;
  const backLabel = startsFromEnglish ? "Word" : "English";
  const backText = startsFromEnglish ? card.word : card.translation;
  const tapHint = startsFromEnglish
    ? "Tap to see the word"
    : "Tap to see the English";

  const swipe = useCardSwipe({
    onTap: onFlip,
    onSwipe: (direction) => {
      if (direction === "right") {
        onSwipeRight?.();
        return;
      }
      onSwipeLeft?.();
    },
  });

  const rotation = swipe.offset / 22;
  const yesOpacity = Math.min(1, Math.max(0, swipe.offset / 96));
  const noOpacity = Math.min(1, Math.max(0, -swipe.offset / 96));

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={flipped ? `Hide the ${backLabel.toLowerCase()}` : tapHint}
      className="relative block w-full touch-none select-none text-left outline-none [perspective:1400px]"
      style={{
        transform: `translateX(${swipe.offset}px) rotate(${rotation}deg)`,
        transition: swipe.leaving
          ? "transform 220ms ease-out"
          : swipe.offset === 0
            ? "transform 180ms ease-out"
            : "none",
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onFlip();
        }
      }}
      {...swipe.bind}
    >
      <div
        className={cn(
          "relative min-h-[300px] w-full [transform-style:preserve-3d] sm:min-h-[340px]",
          !swipe.leaving && "transition-transform duration-500",
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
          <p className="text-sm text-white/55">Swipe right for Yes, left for No</p>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-4 flex items-start justify-between"
        aria-hidden
      >
        <span
          className="rounded-lg border-2 border-rose-500 px-2.5 py-1 text-sm font-semibold tracking-wide text-rose-600 uppercase"
          style={{ opacity: noOpacity }}
        >
          No
        </span>
        <span
          className="rounded-lg border-2 border-emerald-600 px-2.5 py-1 text-sm font-semibold tracking-wide text-emerald-700 uppercase"
          style={{ opacity: yesOpacity }}
        >
          Yes
        </span>
      </div>
    </div>
  );
}

export function SwipeHints() {
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <p className="flex items-center justify-center gap-1.5 rounded-2xl bg-rose-50 px-3 py-3 text-rose-900 ring-1 ring-rose-200">
        <X className="size-4" />
        Swipe left · No
      </p>
      <p className="flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-50 px-3 py-3 text-emerald-900 ring-1 ring-emerald-200">
        <Check className="size-4" />
        Swipe right · Yes
      </p>
    </div>
  );
}
