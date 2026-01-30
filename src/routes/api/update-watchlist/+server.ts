import type { RequestHandler } from "./$types";
import { serialize } from "object-to-formdata";

// Type for the new watchlist ticker format
type WatchlistTicker = {
  symbol: string;
  note: string;
  addedPrice: number | null;
};

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
  const { user, pb } = locals;
  const data = await request.json();

  const watchListId = data?.watchListId;
  const mode = data?.mode; // 'add', 'delete', 'note', or undefined (legacy toggle)
  let output;

  const isSubscribed = user?.tier === "Pro" || user?.tier === "Plus";
  const tickerLimit = user?.tier === "Pro" ? 300 : user?.tier === "Plus" ? 100 : 5;

  try {
    const watchList = await pb.collection("watchlist").getOne(watchListId);

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
      const note = data?.note ?? "";

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

      // If input is array of strings, convert to objects preserving existing metadata
      let newTickers: WatchlistTicker[];
      if (tickerInput.length > 0 && typeof tickerInput[0] === "string") {
        // Input is symbols to keep - preserve existing metadata
        const symbolsToKeep = new Set(tickerInput as string[]);
        newTickers = currentTickers.filter((t) => symbolsToKeep.has(t.symbol));
      } else if (isNewFormat(tickerInput)) {
        // Input is already in new format
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
          // Array of symbols - create new objects with price
          newTickers = (tickerInput as string[]).map((symbol) => ({
            symbol,
            note: "",
            addedPrice: addedPrice,
          }));
        } else if (isNewFormat(tickerInput)) {
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
        const symbol = tickerInput as string;
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
          currentTickers.push({
            symbol,
            note: "",
            addedPrice: addedPrice,
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
        tickersArray = (tickerInput as string[]).map((symbol) => ({
          symbol,
          note: "",
          addedPrice: addedPrice,
        }));
      } else if (isNewFormat(tickerInput)) {
        tickersArray = tickerInput;
      } else {
        tickersArray = convertToNewFormat(tickerInput);
      }
    } else {
      tickersArray = [
        {
          symbol: tickerInput as string,
          note: "",
          addedPrice: addedPrice,
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
