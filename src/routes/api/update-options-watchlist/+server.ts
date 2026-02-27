import type { RequestHandler } from "./$types";
import { serialize } from "object-to-formdata";

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

export const POST: RequestHandler = async ({ request, locals }) => {
  const body = await request.json();
  const { pb, user } = locals;

  if (user?.tier !== "Pro") {
    return new Response(JSON.stringify({ error: "Pro required" }), { status: 403 });
  }

  if (!user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const item = body?.item;
  const watchlistId = body?.id;

  if (!item?.id || !item?.ticker) {
    return new Response(JSON.stringify({ error: "Invalid item" }), { status: 400 });
  }

  let output;

  try {
    // Try to get existing watchlist record
    const watchList = await pb.collection("optionsWatchlist").getOne(watchlistId);

    // Verify ownership
    if (watchList.user !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const currentData = parseDataArray(watchList.data);
    const existingIndex = currentData.findIndex((d: any) => d.id === item.id);

    let updatedData: any[];

    if (existingIndex !== -1) {
      // Remove from watchlist
      updatedData = currentData.filter((_: any, i: number) => i !== existingIndex);
    } else {
      // Add to watchlist
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
    // Watchlist record doesn't exist — create one
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

  // Return lightweight response: record ID + list of bookmarked item IDs
  const responseData = parseDataArray(output?.data);
  const bookmarkedIds = responseData.map((d: any) => d.id).filter(Boolean);

  return new Response(
    JSON.stringify({ watchlistId: output?.id, bookmarkedIds }),
  );
};
