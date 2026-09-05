"use client";

import Link from "next/link";
import { BookOpen, RotateCcw } from "lucide-react";

import { AddCardDialog } from "@/components/add-card-dialog";
import { CardList } from "@/components/card-list";
import { Button, buttonVariants } from "@/components/ui/button";
import { useDeck } from "@/lib/deck-context";
import { cn } from "@/lib/utils";

export function HomeView() {
  const { cards, toLearn, knownCount, resetKnown } = useDeck();
  const canLearn = toLearn.length > 0;
  const allKnown = cards.length > 0 && toLearn.length === 0;

  return (
    <div className="grid gap-8">
      <section className="rounded-[1.75rem] bg-card px-5 py-6 shadow-sm ring-1 ring-foreground/8 sm:px-6">
        <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
          Your deck
        </p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight text-balance">
          See a word or the English. Say if you know it.
        </h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Add words with an English translation and an example. Each card starts
          from the word or the English at random. Yes keeps it as known. No
          takes it out of this session.
        </p>

        <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
          <Stat label="Cards" value={cards.length} />
          <Stat label="To learn" value={toLearn.length} />
          <Stat label="Known" value={knownCount} />
        </dl>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          {canLearn ? (
            <Link
              href="/learn"
              className={cn(buttonVariants(), "h-10 flex-1")}
            >
              <BookOpen data-icon="inline-start" />
              Start learning
            </Link>
          ) : (
            <Button className="h-10 flex-1" disabled>
              <BookOpen data-icon="inline-start" />
              {allKnown ? "Nothing left to learn" : "Add a word first"}
            </Button>
          )}
          <AddCardDialog triggerClassName="h-10 flex-1" />
        </div>

        {allKnown ? (
          <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-200">
            <p>Every word is marked as known.</p>
            <Button
              variant="ghost"
              className="mt-2 h-8 px-2 text-emerald-900 hover:bg-emerald-100 hover:text-emerald-950"
              onClick={resetKnown}
            >
              <RotateCcw data-icon="inline-start" />
              Study them again
            </Button>
          </div>
        ) : knownCount > 0 ? (
          <button
            type="button"
            onClick={resetKnown}
            className="mt-4 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Reset known words
          </button>
        ) : null}
      </section>

      <section className="grid gap-3">
        <div className="flex items-end justify-between gap-3 px-1">
          <h2 className="font-serif text-xl tracking-tight">Words</h2>
          <p className="text-xs text-muted-foreground">
            Newest first
          </p>
        </div>
        <CardList />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-[oklch(0.96_0.012_80)] px-2 py-3">
      <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 font-serif text-2xl leading-none">{value}</dd>
    </div>
  );
}
