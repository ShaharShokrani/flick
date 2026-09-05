import {
  addCardToDeck,
  readDeck,
  resetDeckSchedule,
  reviewCardInDeck,
  updateCardInDeck,
  writeDeck,
} from "@/lib/cards-file";
import { json, API_HEADERS } from "@/lib/api";
import { isAuthConfigured } from "@/lib/auth";
import { parseAddCardInput, parseEditCardInput } from "@/lib/card-model";
import { ensureDb, canUseDatabase } from "@/lib/db";
import { dueCards } from "@/lib/schedule";
import { getCurrentUser } from "@/lib/session";
import {
  addUserCard,
  deleteUserCard,
  importUserCards,
  listUserCards,
  resetUserSchedule,
  reviewUserCard,
  updateUserCard,
} from "@/lib/user-cards";
import type { Flashcard } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: API_HEADERS });
}

function isLocalHost(request: Request) {
  const host = new URL(request.url).hostname;
  return host === "localhost" || host === "127.0.0.1";
}

async function loadDeck(request: Request) {
  const user = isAuthConfigured() ? await getCurrentUser(request) : null;
  if (user) {
    await ensureDb();
    return {
      userId: user.id,
      cards: await listUserCards(user.id),
    };
  }
  if (isLocalHost(request)) {
    return { userId: null, cards: readDeck() };
  }
  return { userId: null, cards: null };
}

function filterCards(cards: Flashcard[], request: Request) {
  const url = new URL(request.url);
  const learned =
    url.searchParams.get("learned") === "1" ||
    url.searchParams.get("known") === "true";
  const due =
    url.searchParams.get("due") === "1" ||
    url.searchParams.get("today") === "1";
  if (due) {
    return dueCards(cards);
  }
  if (learned) {
    return cards.filter((card) => card.known);
  }
  return cards;
}

export async function GET(request: Request) {
  const deck = await loadDeck(request);
  if (!deck.cards) {
    return json({ cards: [], local: true });
  }
  return json({ cards: filterCards(deck.cards, request), userId: deck.userId });
}

export async function POST(request: Request) {
  const body = await readBody(request);
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : null;

  if (record?.import === true && Array.isArray(record.cards)) {
    const user = isAuthConfigured() ? await getCurrentUser(request) : null;
    if (!user || !canUseDatabase()) {
      return json({ error: "Sign in to sync this deck." }, 401);
    }
    await ensureDb();
    const cards = await importUserCards(user.id, record.cards as Flashcard[]);
    return json({ cards });
  }

  const input = parseAddCardInput(body);
  if (!input) {
    return json(
      {
        error: "Send a word and its English translation.",
        example: {
          word: "haus",
          translation: "house",
          example: "Das Haus ist groß.",
          known: true,
        },
      },
      400
    );
  }

  const user = isAuthConfigured() ? await getCurrentUser(request) : null;
  if (user) {
    await ensureDb();
    const result = await addUserCard(user.id, input);
    return json(result, result.created ? 201 : 200);
  }

  if (!isLocalHost(request)) {
    return json({ error: "Sign in to save words to your account." }, 401);
  }

  const { card, cards, created } = addCardToDeck(input);
  return json({ card, cards, created }, created ? 201 : 200);
}

export async function PATCH(request: Request) {
  const body = (await readBody(request)) as Record<string, unknown> | null;
  if (!body) {
    return json({ error: "Expected a JSON body." }, 400);
  }

  const user = isAuthConfigured() ? await getCurrentUser(request) : null;
  if (user) {
    await ensureDb();
    if (body.resetKnown === true || body.resetSchedule === true) {
      return json({ cards: await resetUserSchedule(user.id) });
    }
    if (typeof body.id !== "string") {
      return json({ error: "Send the card id to update." }, 400);
    }
    if (
      body.word !== undefined ||
      body.translation !== undefined ||
      body.english !== undefined ||
      body.example !== undefined
    ) {
      const input = parseEditCardInput(body);
      if (!input) {
        return json({ error: "Send the word and its English translation." }, 400);
      }
      const updated = await updateUserCard(user.id, input);
      if ("error" in updated) {
        return json(
          {
            error:
              updated.error === "duplicate"
                ? "That word is already in the deck."
                : "Card not found.",
          },
          updated.error === "duplicate" ? 409 : 404
        );
      }
      return json(updated);
    }
    if (body.remembered === undefined && body.known === undefined) {
      return json({ error: "Send remembered: true or false." }, 400);
    }
    const remembered =
      body.remembered === true ||
      (body.remembered === undefined && body.known === true);
    const updated = await reviewUserCard(user.id, body.id, remembered);
    if (!updated) {
      return json({ error: "Card not found." }, 404);
    }
    return json(updated);
  }

  if (!isLocalHost(request)) {
    return json({ error: "Sign in to update your deck." }, 401);
  }

  if (body.resetKnown === true || body.resetSchedule === true) {
    return json({ cards: resetDeckSchedule() });
  }

  if (typeof body.id !== "string") {
    return json({ error: "Send the card id to update." }, 400);
  }

  if (
    body.word !== undefined ||
    body.translation !== undefined ||
    body.english !== undefined ||
    body.example !== undefined
  ) {
    const input = parseEditCardInput(body);
    if (!input) {
      return json({ error: "Send the word and its English translation." }, 400);
    }
    const updated = updateCardInDeck(input);
    if ("error" in updated) {
      return json(
        {
          error:
            updated.error === "duplicate"
              ? "That word is already in the deck."
              : "Card not found.",
        },
        updated.error === "duplicate" ? 409 : 404
      );
    }
    return json(updated);
  }

  if (body.remembered === undefined && body.known === undefined) {
    return json({ error: "Send remembered: true or false." }, 400);
  }

  const remembered =
    body.remembered === true ||
    (body.remembered === undefined && body.known === true);

  const updated = reviewCardInDeck(body.id, remembered);
  if (!updated) {
    return json({ error: "Card not found." }, 404);
  }
  return json(updated);
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return json({ error: "Pass ?id= to delete a card." }, 400);
  }

  const user = isAuthConfigured() ? await getCurrentUser(request) : null;
  if (user) {
    await ensureDb();
    return json({ cards: await deleteUserCard(user.id, id) });
  }

  if (!isLocalHost(request)) {
    return json({ error: "Sign in to delete a card." }, 401);
  }

  const cards = readDeck().filter((card) => card.id !== id);
  writeDeck(cards);
  return json({ cards });
}

async function readBody(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await request.formData();
    return Object.fromEntries(form.entries());
  }
  try {
    return await request.json();
  } catch {
    return null;
  }
}
