import type { RequestHandler } from "./$types";

const WATCHLIST_ID_REGEX = /^[a-zA-Z0-9]{15}$/;

function isValidWatchlistId(id: unknown): id is string {
  return typeof id === "string" && WATCHLIST_ID_REGEX.test(id);
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

export const POST = (async ({ request, locals }) => {
  const { user, pb } = locals;

  if (!user?.id) {
    return new Response(
      JSON.stringify({ error: "Authentication required" }),
      { status: 401 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400 },
    );
  }

  const watchListId = body?.watchListId;
  const itemId = body?.itemId;

  if (!isValidWatchlistId(watchListId)) {
    return new Response(
      JSON.stringify({ error: "Invalid watchlist ID" }),
      { status: 400 },
    );
  }

  if (!itemId || typeof itemId !== "string") {
    return new Response(
      JSON.stringify({ error: "Invalid item ID" }),
      { status: 400 },
    );
  }

  try {
    const watchList = await pb.collection("optionsWatchlist").getOne(watchListId);

    if (watchList.user !== user.id) {
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403 },
      );
    }

    const data = parseDataArray(watchList.data);
    const item = data.find((d: any) => d.id === itemId);

    if (!item) {
      return new Response(
        JSON.stringify({ error: "Item not found in watchlist" }),
        { status: 404 },
      );
    }

    return new Response(
      JSON.stringify({
        itemId,
        note: item.note || "",
      }),
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Watchlist not found" }),
      { status: 404 },
    );
  }
}) satisfies RequestHandler;
