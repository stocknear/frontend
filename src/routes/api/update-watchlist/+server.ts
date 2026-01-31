import type { RequestHandler } from "./$types";
import { serialize } from "object-to-formdata";

// Type for the new watchlist ticker format
type WatchlistTicker = {
  symbol: string;
  note: string;
  addedPrice: number | null;
};

// Security: Constants for validation
const MAX_NOTE_LENGTH = 50000; // 50KB max note size
const MAX_SYMBOL_LENGTH = 20;
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

// Security: Sanitize and validate note content
function sanitizeNote(note: unknown): string {
  if (typeof note !== "string") return "";
  // Truncate to max length
  return note.slice(0, MAX_NOTE_LENGTH);
}

// Helper to fetch the current price for a ticker from the backend
async function fetchTickerPrice(
  apiURL: string,
  apiKey: string,
  ticker: string
): Promise<number | null> {
  try {
    const response = await fetch(`${apiURL}/stock-quote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({ ticker }),
    });
    if (response.ok) {
      const data = await response.json();
      return data?.price ?? null;
    }
  } catch {
    // Silently fail - price fetch is not critical
  }
  return null;
}

// Helper to check if ticker list is in new object format
function isNewFormat(tickers: unknown[]): tickers is WatchlistTicker[] {
  return tickers.length > 0 && typeof tickers[0] === "object" && tickers[0] !== null && "symbol" in tickers[0];
}

// Helper to convert old format to new format
function convertToNewFormat(tickers: (string | WatchlistTicker)[]): WatchlistTicker[] {
  return tickers.map((t) => {
    if (typeof t === "string") {
      return { symbol: t, note: "", addedPrice: null };
    }
    return {
      symbol: t.symbol || "",
      note: t.note || "",
      addedPrice: t.addedPrice ?? null,
    };
  });
}

// Helper to find ticker index by symbol
function findTickerIndex(tickers: WatchlistTicker[], symbol: string): number {
  return tickers.findIndex((t) => t.symbol === symbol);
}

export const POST = (async ({ request, locals }) => {
  const { user, pb, apiURL, apiKey } = locals;

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
  const mode = data?.mode; // 'add', 'delete', 'note', or undefined (legacy toggle)
  let output;

  // Security: Validate watchListId format
  if (!isValidWatchlistId(watchListId)) {
    return new Response(
      JSON.stringify({ error: "Invalid watchlist ID" }),
      { status: 400 }
    );
  }

  const isSubscribed = user?.tier === "Pro" || user?.tier === "Plus";
  const tickerLimit = user?.tier === "Pro" ? 300 : user?.tier === "Plus" ? 100 : 5;

  try {
    const watchList = await pb.collection("watchlist").getOne(watchListId);

    // Security: Verify user owns this watchlist (authorization check)
    if (watchList.user !== user.id) {
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403 }
      );
    }

    // Parse current tickers
    let rawTickers = watchList?.ticker;
    if (typeof rawTickers === "string") {
      try {
        rawTickers = JSON.parse(rawTickers);
      } catch {
        rawTickers = [];
      }
    }
    rawTickers = rawTickers || [];

    // Convert to new format if needed
    let currentTickers: WatchlistTicker[] = isNewFormat(rawTickers)
      ? rawTickers
      : convertToNewFormat(rawTickers);

    // Handle different modes
    if (mode === "note") {
      // Update note for a specific ticker
      const symbol = data?.symbol;

      // Security: Validate symbol format
      if (!isValidSymbol(symbol)) {
        return new Response(
          JSON.stringify({ error: "Invalid symbol format" }),
          { status: 400 }
        );
      }

      // Security: Sanitize and limit note size
      const note = sanitizeNote(data?.note);

      const index = findTickerIndex(currentTickers, symbol);
      if (index !== -1) {
        currentTickers[index].note = note;
        output = await pb.collection("watchlist").update(watchListId, {
          ticker: currentTickers,
        });
      } else {
        return new Response(
          JSON.stringify({ error: "Ticker not found in watchlist" }),
          { status: 404 }
        );
      }
    } else if (mode === "delete") {
      // Delete mode: tickerInput is the new array (already filtered)
      const tickerInput = data?.ticker || [];

      // Security: Validate tickerInput is an array
      if (!Array.isArray(tickerInput)) {
        return new Response(
          JSON.stringify({ error: "Invalid ticker data" }),
          { status: 400 }
        );
      }

      // If input is array of strings, convert to objects preserving existing metadata
      let newTickers: WatchlistTicker[];
      if (tickerInput.length > 0 && typeof tickerInput[0] === "string") {
        // Security: Validate each symbol in the array
        for (const sym of tickerInput) {
          if (!isValidSymbol(sym)) {
            return new Response(
              JSON.stringify({ error: "Invalid symbol format in array" }),
              { status: 400 }
            );
          }
        }
        // Input is symbols to keep - preserve existing metadata
        const symbolsToKeep = new Set(tickerInput as string[]);
        newTickers = currentTickers.filter((t) => symbolsToKeep.has(t.symbol));
      } else if (isNewFormat(tickerInput)) {
        // Security: Validate symbols in new format
        for (const t of tickerInput) {
          if (!isValidSymbol(t.symbol)) {
            return new Response(
              JSON.stringify({ error: "Invalid symbol format in array" }),
              { status: 400 }
            );
          }
          // Sanitize notes in the array
          t.note = sanitizeNote(t.note);
        }
        newTickers = tickerInput;
      } else {
        newTickers = convertToNewFormat(tickerInput);
      }

      output = await pb.collection("watchlist").update(watchListId, {
        ticker: newTickers,
      });
    } else {
      // Add or toggle mode
      const tickerInput = data?.ticker;
      const addedPrice = data?.price ?? null;

      if (Array.isArray(tickerInput)) {
        // Batch update - replace entire list
        let newTickers: WatchlistTicker[];

        if (tickerInput.length > 0 && typeof tickerInput[0] === "string") {
          // Security: Validate each symbol
          for (const sym of tickerInput) {
            if (!isValidSymbol(sym)) {
              return new Response(
                JSON.stringify({ error: "Invalid symbol format in array" }),
                { status: 400 }
              );
            }
          }
          // Array of symbols - create new objects with price
          newTickers = (tickerInput as string[]).map((symbol) => ({
            symbol,
            note: "",
            addedPrice: addedPrice,
          }));
        } else if (isNewFormat(tickerInput)) {
          // Security: Validate symbols in new format
          for (const t of tickerInput) {
            if (!isValidSymbol(t.symbol)) {
              return new Response(
                JSON.stringify({ error: "Invalid symbol format in array" }),
                { status: 400 }
              );
            }
            // Sanitize notes
            t.note = sanitizeNote(t.note);
          }
          newTickers = tickerInput;
        } else {
          newTickers = convertToNewFormat(tickerInput);
        }

        if (newTickers.length > tickerLimit) {
          return new Response(
            JSON.stringify({
              error: isSubscribed
                ? `You can only have up to ${tickerLimit} stocks in your watchlist.`
                : `Want to add more stocks? Go Plus or Pro!`,
            }),
            { status: 403 }
          );
        }

        output = await pb.collection("watchlist").update(watchListId, {
          ticker: newTickers,
        });
      } else {
        // Single ticker toggle
        const symbol = tickerInput;

        // Security: Validate single symbol
        if (!isValidSymbol(symbol)) {
          return new Response(
            JSON.stringify({ error: "Invalid symbol format" }),
            { status: 400 }
          );
        }

        const existingIndex = findTickerIndex(currentTickers, symbol);

        if (existingIndex !== -1) {
          // Remove the ticker
          currentTickers.splice(existingIndex, 1);
        } else {
          // Add the ticker
          if (currentTickers.length >= tickerLimit) {
            return new Response(
              JSON.stringify({
                error: isSubscribed
                  ? `You can only have up to ${tickerLimit} stocks in your watchlist.`
                  : `Want to add more stocks? Go Plus or Pro!`,
              }),
              { status: 403 }
            );
          }
          // Fetch price server-side if not provided
          const tickerPrice = addedPrice ?? await fetchTickerPrice(apiURL, apiKey, symbol);
          currentTickers.push({
            symbol,
            note: "",
            addedPrice: tickerPrice,
          });
        }

        output = await pb.collection("watchlist").update(watchListId, {
          ticker: currentTickers,
        });
      }
    }
  } catch (e) {
    // If the watchlist doesn't exist, create a new one
    const tickerInput = data?.ticker;
    const addedPrice = data?.price ?? null;

    let tickersArray: WatchlistTicker[];

    if (Array.isArray(tickerInput)) {
      if (tickerInput.length > 0 && typeof tickerInput[0] === "string") {
        // Security: Validate each symbol
        for (const sym of tickerInput) {
          if (!isValidSymbol(sym)) {
            return new Response(
              JSON.stringify({ error: "Invalid symbol format in array" }),
              { status: 400 }
            );
          }
        }
        tickersArray = (tickerInput as string[]).map((symbol) => ({
          symbol,
          note: "",
          addedPrice: addedPrice,
        }));
      } else if (isNewFormat(tickerInput)) {
        // Security: Validate symbols in new format
        for (const t of tickerInput) {
          if (!isValidSymbol(t.symbol)) {
            return new Response(
              JSON.stringify({ error: "Invalid symbol format in array" }),
              { status: 400 }
            );
          }
          // Sanitize notes
          t.note = sanitizeNote(t.note);
        }
        tickersArray = tickerInput;
      } else {
        tickersArray = convertToNewFormat(tickerInput);
      }
    } else {
      // Single ticker - fetch price server-side if not provided
      const symbol = tickerInput;

      // Security: Validate single symbol
      if (!isValidSymbol(symbol)) {
        return new Response(
          JSON.stringify({ error: "Invalid symbol format" }),
          { status: 400 }
        );
      }

      const tickerPrice = addedPrice ?? await fetchTickerPrice(apiURL, apiKey, symbol);
      tickersArray = [
        {
          symbol,
          note: "",
          addedPrice: tickerPrice,
        },
      ];
    }

    if (tickersArray.length > tickerLimit) {
      return new Response(
        JSON.stringify({
          error: isSubscribed
            ? `You can only have up to ${tickerLimit} stocks in your watchlist.`
            : `Want to add more stocks? Go Plus or Pro!`,
        }),
        { status: 403 }
      );
    }

    output = await pb.collection("watchlist").create(
      serialize({
        user: user?.id,
        ticker: JSON.stringify(tickersArray),
        title: "Favorites",
      })
    );
  }

  return new Response(JSON.stringify(output));
}) satisfies RequestHandler;
