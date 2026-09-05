import type { Flashcard } from "@/lib/types";

export const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;
const MAX_EASE = 3.0;

export function startOfDay(at = Date.now()) {
  const date = new Date(at);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function addDays(from: number, days: number) {
  const date = new Date(from);
  date.setDate(date.getDate() + days);
  return date.getTime();
}

export function endOfDay(at = Date.now()) {
  return addDays(startOfDay(at), 1);
}

export function normalizeCard(
  card: Flashcard,
  now = Date.now()
): Flashcard {
  const dueAt =
    typeof card.dueAt === "number"
      ? card.dueAt
      : card.known
        ? addDays(startOfDay(now), 1)
        : startOfDay(now);
  const intervalDays =
    typeof card.intervalDays === "number"
      ? card.intervalDays
      : card.known
        ? 1
        : 0;
  const repetitions =
    typeof card.repetitions === "number"
      ? card.repetitions
      : card.known
        ? 1
        : 0;
  const ease = typeof card.ease === "number" ? card.ease : DEFAULT_EASE;

  return {
    ...card,
    dueAt,
    intervalDays,
    repetitions,
    ease,
  };
}

export function isDue(card: Flashcard, now = Date.now()) {
  return normalizeCard(card, now).dueAt < endOfDay(now);
}

export function dueCards(cards: Flashcard[], now = Date.now()) {
  return cards.filter((card) => isDue(card, now));
}

export function upcomingCards(cards: Flashcard[], now = Date.now()) {
  return cards
    .filter((card) => !isDue(card, now))
    .sort((a, b) => normalizeCard(a, now).dueAt - normalizeCard(b, now).dueAt);
}

export function nextDueAt(cards: Flashcard[], now = Date.now()) {
  const upcoming = upcomingCards(cards, now);
  return upcoming[0] ? normalizeCard(upcoming[0], now).dueAt : null;
}

export function scheduleNewCard(known: boolean, now = Date.now()): Pick<
  Flashcard,
  "known" | "dueAt" | "intervalDays" | "repetitions" | "ease"
> {
  if (known) {
    return {
      known: true,
      dueAt: addDays(startOfDay(now), 1),
      intervalDays: 1,
      repetitions: 1,
      ease: DEFAULT_EASE,
    };
  }

  return {
    known: false,
    dueAt: startOfDay(now),
    intervalDays: 0,
    repetitions: 0,
    ease: DEFAULT_EASE,
  };
}

export function reviewCard(
  card: Flashcard,
  remembered: boolean,
  now = Date.now()
): Flashcard {
  const current = normalizeCard(card, now);
  const today = startOfDay(now);

  if (!remembered) {
    return {
      ...current,
      known: false,
      repetitions: 0,
      intervalDays: 1,
      ease: clampEase(current.ease - 0.2),
      dueAt: addDays(today, 1),
    };
  }

  const repetitions = current.repetitions + 1;
  const intervalDays = nextInterval(
    current.intervalDays,
    repetitions,
    current.ease
  );
  return {
    ...current,
    known: true,
    repetitions,
    intervalDays,
    ease: clampEase(current.ease + 0.15),
    dueAt: addDays(today, intervalDays),
  };
}

export function resetSchedule(card: Flashcard, now = Date.now()): Flashcard {
  return {
    ...normalizeCard(card, now),
    ...scheduleNewCard(false, now),
  };
}

export function daysUntilDue(card: Flashcard, now = Date.now()) {
  const due = startOfDay(normalizeCard(card, now).dueAt);
  const today = startOfDay(now);
  return Math.round((due - today) / 86_400_000);
}

export function formatDue(card: Flashcard, now = Date.now()) {
  if (isDue(card, now)) {
    return "Due today";
  }

  const days = daysUntilDue(card, now);
  if (days <= 1) {
    return "Tomorrow";
  }
  if (days < 14) {
    return `In ${days} days`;
  }

  return new Date(normalizeCard(card, now).dueAt).toLocaleDateString(
    undefined,
    { month: "short", day: "numeric" }
  );
}

export function formatNextReview(at: number, now = Date.now()) {
  const days = Math.round((startOfDay(at) - startOfDay(now)) / 86_400_000);
  if (days <= 0) {
    return "today";
  }
  if (days === 1) {
    return "tomorrow";
  }
  return new Date(at).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function nextInterval(
  previousInterval: number,
  repetitions: number,
  ease: number
) {
  if (repetitions <= 1) {
    return 1;
  }
  if (repetitions === 2) {
    return 3;
  }
  if (repetitions === 3) {
    return 7;
  }
  return Math.max(8, Math.round(previousInterval * ease));
}

function clampEase(value: number) {
  return Math.min(MAX_EASE, Math.max(MIN_EASE, value));
}
