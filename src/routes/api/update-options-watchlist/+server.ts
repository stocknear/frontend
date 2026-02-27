import type { RequestHandler } from "./$types";
import { serialize } from "object-to-formdata";

const MAX_NOTE_LENGTH = 50000;

const ALLOWED_FIELDS = new Set([
  "id",
  "ticker",
  "option_symbol",
  "put_call",
  "strike_price",
  "date_expiration",
  "sentiment",
  "option_activity_type",
  "cost_basis",
  "price",
  "underlying_price",
  "size",
  "volume",
  "open_interest",
  "execution_estimate",
  "trade_leg_type",
  "underlying_type",
  "date",
  "time",
]);

function sanitizeItem(item: any): Record<string, any> | null {
  if (!item || typeof item !== "object" || !item.id || !item.ticker) {
    return null;
  }
  const sanitized: Record<string, any> = {};
  for (const key of ALLOWED_FIELDS) {
    if (item[key] !== undefined) {
      sanitized[key] = item[key];
    }
  }
  sanitized.note = "";
  sanitized.addedDate = new Date().toISOString();
  return sanitized;
}

function parseDataArray(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function sanitizeNote(note: any): string {
  if (typeof note !== "string") return "";
  return note.slice(0, MAX_NOTE_LENGTH);
}

/** Strips notes from data items, returning lightweight items with hasNote flag */
function stripNotes(data: any[]): any[] {
  return data.map((d) => {
    const { note, ...rest } = d;
    return { ...rest, hasNote: Boolean(note && note.trim?.().length > 0) };
  });
}

async function getWatchlist(pb: any, user: any) {
  const records = await pb.collection("optionsWatchlist").getFullList({
    filter: `user="${user.id}"`,
  });
  return records?.at(0);
}

export const POST: RequestHandler = async ({ request, locals }) => {
  const body = await request.json();
  const { pb, user } = locals;

  if (user?.tier !== "Pro") {
    return new Response(JSON.stringify({ error: "Pro required" }), { status: 403 });
  }

  if (!user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const mode = body?.mode;

  // ─── MODE: "delete" ── Bulk remove items by ID array ───
  if (mode === "delete") {
    const itemIds: string[] = body?.itemIds;
    const watchlistId = body?.id;

    if (!Array.isArray(itemIds) || itemIds.length === 0 || !watchlistId) {
      return new Response(JSON.stringify({ error: "Invalid delete request" }), { status: 400 });
    }

    try {
      const watchList = await pb.collection("optionsWatchlist").getOne(watchlistId);
      if (watchList.user !== user.id) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
      }

      const currentData = parseDataArray(watchList.data);
      const idsToRemove = new Set(itemIds);
      const updatedData = currentData.filter((d: any) => !idsToRemove.has(d.id));

      const output = await pb
        .collection("optionsWatchlist")
        .update(watchlistId, { data: updatedData });

      return new Response(
        JSON.stringify({
          watchlistId: output?.id,
          data: stripNotes(parseDataArray(output?.data)),
        }),
      );
    } catch (e) {
      return new Response(JSON.stringify({ error: "Failed to delete items" }), { status: 500 });
    }
  }

  // ─── MODE: "note" ── Update note for a specific item ───
  if (mode === "note") {
    const itemId = body?.itemId;
    const note = sanitizeNote(body?.note);
    const watchlistId = body?.id;

    if (!itemId || !watchlistId) {
      return new Response(JSON.stringify({ error: "Invalid note request" }), { status: 400 });
    }

    try {
      const watchList = await pb.collection("optionsWatchlist").getOne(watchlistId);
      if (watchList.user !== user.id) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
      }

      const currentData = parseDataArray(watchList.data);
      const itemIndex = currentData.findIndex((d: any) => d.id === itemId);

      if (itemIndex === -1) {
        return new Response(JSON.stringify({ error: "Item not found" }), { status: 404 });
      }

      currentData[itemIndex] = { ...currentData[itemIndex], note };

      const output = await pb
        .collection("optionsWatchlist")
        .update(watchlistId, { data: currentData });

      return new Response(
        JSON.stringify({
          watchlistId: output?.id,
          hasNote: Boolean(note && note.trim().length > 0),
        }),
      );
    } catch (e) {
      return new Response(JSON.stringify({ error: "Failed to update note" }), { status: 500 });
    }
  }

  // ─── DEFAULT: Toggle add/remove single item ───
  const item = body?.item;
  const watchlistId = body?.id;

  if (!item?.id || !item?.ticker) {
    return new Response(JSON.stringify({ error: "Invalid item" }), { status: 400 });
  }

  let output;

  try {
    const watchList = await pb.collection("optionsWatchlist").getOne(watchlistId);

    if (watchList.user !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const currentData = parseDataArray(watchList.data);
    const existingIndex = currentData.findIndex((d: any) => d.id === item.id);

    let updatedData: any[];

    if (existingIndex !== -1) {
      updatedData = currentData.filter((_: any, i: number) => i !== existingIndex);
    } else {
      const sanitized = sanitizeItem(item);
      if (!sanitized) {
        return new Response(JSON.stringify({ error: "Invalid item data" }), { status: 400 });
      }
      updatedData = [...currentData, sanitized];
    }

    output = await pb
      .collection("optionsWatchlist")
      .update(watchlistId, { data: updatedData });
  } catch (e) {
    const sanitized = sanitizeItem(item);
    if (!sanitized) {
      return new Response(JSON.stringify({ error: "Invalid item data" }), { status: 400 });
    }

    output = await pb.collection("optionsWatchlist").create(
      serialize({
        user: user.id,
        data: JSON.stringify([sanitized]),
      }),
    );
  }

  const responseData = parseDataArray(output?.data);
  const bookmarkedIds = responseData.map((d: any) => d.id).filter(Boolean);

  return new Response(
    JSON.stringify({ watchlistId: output?.id, bookmarkedIds }),
  );
};
