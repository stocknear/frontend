import type { RequestHandler } from "./$types";

// Security: Constants for validation
const SYMBOL_REGEX = /^[A-Za-z0-9.\-]{1,20}$/;
const WATCHLIST_ID_REGEX = /^[a-zA-Z0-9]{15}$/; // PocketBase ID format



// Security: Validate symbol format
function isValidSymbol(symbol: unknown): symbol is string {
  return typeof symbol === "string" && SYMBOL_REGEX.test(symbol);
}

// Security: Validate watchlist ID format
function isValidWatchlistId(id: unknown): id is string {
  return typeof id === "string" && WATCHLIST_ID_REGEX.test(id);
}

export const POST = (async ({ request, locals }) => {
  const { user, pb } = locals;

  // Security: Check authentication
  if (!user?.id) {
    return new Response(
      JSON.stringify({ error: "Authentication required" }),
      { status: 401 }
    );
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400 }
    );
  }

  const watchListId = data?.watchListId;
  const symbol = data?.symbol;

  // Security: Validate inputs
  if (!isValidWatchlistId(watchListId)) {
    return new Response(
      JSON.stringify({ error: "Invalid watchlist ID" }),
      { status: 400 }
    );
  }

  if (!isValidSymbol(symbol)) {
    return new Response(
      JSON.stringify({ error: "Invalid symbol format" }),
      { status: 400 }
    );
  }

  try {
    const watchList = await pb.collection("watchlist").getOne(watchListId);

    // Security: Verify user owns this watchlist
    if (watchList.user !== user.id) {
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403 }
      );
    }

    // Parse tickers
    let rawTickers = watchList?.ticker;
    if (typeof rawTickers === "string") {
      try {
        rawTickers = JSON.parse(rawTickers);
      } catch {
        rawTickers = [];
      }
    }
    rawTickers = rawTickers || [];

    // Ensure it's an array
    if (!Array.isArray(rawTickers)) {
      rawTickers = [];
    }

    // Find the specific ticker - handle both old format (strings) and new format (objects)
    let tickerNote = "";
    let tickerFound = false;

    for (const t of rawTickers) {
      if (typeof t === "string") {
        // Old format: ticker is just a symbol string, no note
        if (t === symbol) {
          tickerFound = true;
          tickerNote = "";
          break;
        }
      } else if (t && typeof t === "object" && t.symbol === symbol) {
        // New format: ticker is an object with symbol and note
        tickerFound = true;
        tickerNote = t.note || "";
        break;
      }
    }

    if (!tickerFound) {
      return new Response(
        JSON.stringify({ error: "Ticker not found in watchlist" }),
        { status: 404 }
      );
    }

    // Return only the note for this ticker
    return new Response(
      JSON.stringify({
        symbol: symbol,
        note: tickerNote,
      })
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Watchlist not found" }),
      { status: 404 }
    );
  }
}) satisfies RequestHandler;
