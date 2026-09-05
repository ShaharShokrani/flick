"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, RotateCcw, X } from "lucide-react";

import { Flashcard } from "@/components/flashcard";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { useDeck } from "@/lib/deck-context";
import type { Flashcard as FlashcardType } from "@/lib/types";

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export default function LearnPage() {
  const { ready, toLearn, markKnown } = useDeck();
  const [session, setSession] = useState(0);
  const [activeSession, setActiveSession] = useState<number | null>(null);
  const [queue, setQueue] = useState<FlashcardType[] | null>(null);
  const [startingCount, setStartingCount] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knownThisSession, setKnownThisSession] = useState(0);
  const [skippedThisSession, setSkippedThisSession] = useState(0);

  if (ready && activeSession !== session) {
    setActiveSession(session);
    setQueue(shuffle(toLearn));
    setStartingCount(toLearn.length);
    setFlipped(false);
    setKnownThisSession(0);
    setSkippedThisSession(0);
  }

  const current = queue?.[0] ?? null;
  const remaining = queue?.length ?? 0;
  const finished = queue !== null && remaining === 0;
  const reviewed = knownThisSession + skippedThisSession;

  function goNext(nextQueue: FlashcardType[]) {
    setFlipped(false);
    setQueue(nextQueue);
  }

  function handleYes() {
    if (!current) {
      return;
    }
    markKnown(current.id);
    setKnownThisSession((count) => count + 1);
    goNext(queue?.slice(1) ?? []);
  }

  function handleNo() {
    if (!current) {
      return;
    }
    setSkippedThisSession((count) => count + 1);
    goNext(queue?.slice(1) ?? []);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!current) {
        return;
      }
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        setFlipped((value) => !value);
      }
      if (!flipped) {
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        handleYes();
      }
      if (event.key === "n" || event.key === "N") {
        handleNo();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pb-10 sm:px-0">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Button
            nativeButton={false}
            variant="ghost"
            render={<Link href="/" />}
            className="-ml-2"
          >
            <ArrowLeft data-icon="inline-start" />
            Deck
          </Button>
          {queue && !finished ? (
            <p className="text-sm text-muted-foreground">
              {remaining} left
            </p>
          ) : null}
        </div>

        {!ready || queue === null ? (
          <div className="h-80 animate-pulse rounded-[1.75rem] bg-card ring-1 ring-foreground/5" />
        ) : finished ? (
          <SessionDone
            startingCount={startingCount}
            knownThisSession={knownThisSession}
            skippedThisSession={skippedThisSession}
            reviewed={reviewed}
            onRestart={() => setSession((value) => value + 1)}
          />
        ) : current ? (
          <div className="flex flex-1 flex-col gap-6">
            <div className="h-1.5 overflow-hidden rounded-full bg-foreground/8">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${
                    startingCount === 0
                      ? 100
                      : ((startingCount - remaining) / startingCount) * 100
                  }%`,
                }}
              />
            </div>

            <Flashcard
              key={current.id}
              card={current}
              flipped={flipped}
              onFlip={() => setFlipped((value) => !value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-14 rounded-2xl border-rose-200 bg-rose-50 text-rose-950 hover:bg-rose-100 hover:text-rose-950"
                disabled={!flipped}
                onClick={handleNo}
              >
                <X data-icon="inline-start" />
                No
              </Button>
              <Button
                className="h-14 rounded-2xl bg-emerald-700 text-white hover:bg-emerald-700/90"
                disabled={!flipped}
                onClick={handleYes}
              >
                <Check data-icon="inline-start" />
                Yes
              </Button>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {flipped
                ? "Yes marks it as known. No hides it for the rest of this session."
                : "Flip the card first, then choose Yes or No."}
            </p>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function SessionDone({
  startingCount,
  knownThisSession,
  skippedThisSession,
  reviewed,
  onRestart,
}: {
  startingCount: number;
  knownThisSession: number;
  skippedThisSession: number;
  reviewed: number;
  onRestart: () => void;
}) {
  const empty = startingCount === 0;

  return (
    <section className="rounded-[1.75rem] bg-card px-5 py-10 text-center shadow-sm ring-1 ring-foreground/8 sm:px-8">
      <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
        Session finished
      </p>
      <h1 className="mt-3 font-serif text-3xl tracking-tight text-balance">
        {empty ? "Nothing to learn yet" : "That’s all for now"}
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
        {empty
          ? "Add a word to your deck, then come back to flip through it."
          : `You went through ${reviewed} ${reviewed === 1 ? "card" : "cards"}. Known words stay out of future sessions. Skipped words come back next time.`}
      </p>

      {!empty ? (
        <dl className="mx-auto mt-6 grid max-w-xs grid-cols-2 gap-2">
          <div className="rounded-xl bg-emerald-50 px-3 py-3">
            <dt className="text-[11px] tracking-wide text-emerald-800 uppercase">
              Known
            </dt>
            <dd className="mt-1 font-serif text-2xl text-emerald-950">
              {knownThisSession}
            </dd>
          </div>
          <div className="rounded-xl bg-rose-50 px-3 py-3">
            <dt className="text-[11px] tracking-wide text-rose-800 uppercase">
              Skipped
            </dt>
            <dd className="mt-1 font-serif text-2xl text-rose-950">
              {skippedThisSession}
            </dd>
          </div>
        </dl>
      ) : null}

      <div className="mt-8 flex flex-col items-center gap-2">
        <Button nativeButton={false} render={<Link href="/" />} className="h-10">
          <ArrowLeft data-icon="inline-start" />
          Back to deck
        </Button>
        {!empty && skippedThisSession > 0 ? (
          <Button variant="ghost" className="h-10" onClick={onRestart}>
            <RotateCcw data-icon="inline-start" />
            Start again
          </Button>
        ) : null}
      </div>
    </section>
  );
}
