import {
  addCardToDeck,
  readDeck,
  resetDeckSchedule,
  reviewCardInDeck,
  writeDeck,
} from "@/lib/cards-file";
import { json, API_HEADERS } from "@/lib/api";
import { parseAddCardInput } from "@/lib/card-model";
import { dueCards } from "@/lib/schedule";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: API_HEADERS });
}

export function GET(request: Request) {
  const url = new URL(request.url);
  const learned =
    url.searchParams.get("learned") === "1" ||
    url.searchParams.get("known") === "true";
  const due =
    url.searchParams.get("due") === "1" ||
    url.searchParams.get("today") === "1";
  const cards = readDeck();
  const result = due
    ? dueCards(cards)
    : learned
      ? cards.filter((card) => card.known)
      : cards;
  return json({ cards: result });
}

export async function POST(request: Request) {
  const input = parseAddCardInput(await readBody(request));
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

  const { card, cards, created } = addCardToDeck(input);
  return json({ card, cards, created }, created ? 201 : 200);
}

export async function PATCH(request: Request) {
  const body = (await readBody(request)) as Record<string, unknown> | null;
  if (!body) {
    return json({ error: "Expected a JSON body." }, 400);
  }

  if (body.resetKnown === true || body.resetSchedule === true) {
    return json({ cards: resetDeckSchedule() });
  }

  if (typeof body.id !== "string") {
    return json({ error: "Send the card id to update." }, 400);
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

export function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return json({ error: "Pass ?id= to delete a card." }, 400);
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
