// Type for the watchlist ticker format
type WatchlistTicker = {
  symbol: string;
  note: string;
  addedPrice: number | null;
};

// Type for the light ticker format (without notes for initial load)
type LightTicker = {
  symbol: string;
  addedPrice: number | null;
  hasNote: boolean; // Flag to indicate if a note exists
};

// Strip notes from ticker data for efficient initial load
function stripNotesFromTickers(tickers: unknown): LightTicker[] {
  if (!tickers) return [];

  let tickerArray: WatchlistTicker[];

  // Handle string format (JSON stored in DB)
  if (typeof tickers === "string") {
    try {
      tickerArray = JSON.parse(tickers);
    } catch {
      return [];
    }
  } else if (Array.isArray(tickers)) {
    tickerArray = tickers;
  } else {
    return [];
  }

  // Ensure tickerArray is a valid array
  if (!Array.isArray(tickerArray) || tickerArray.length === 0) {
    return [];
  }

  // Convert to light format without note content
  return tickerArray.map((t) => ({
    symbol: typeof t === "string" ? t : (t?.symbol || ""),
    addedPrice: typeof t === "string" ? null : (t?.addedPrice ?? null),
    hasNote: typeof t === "string" ? false : Boolean(t?.note && t.note.trim().length > 0),
  }));
}

export const load = async ({ locals }) => {
  const getAllWatchlist = async () => {
    const { pb, user } = locals;

    try {
      const output = await pb.collection("watchlist").getFullList({
        filter: `user="${user?.id}"`,
        sort: "-updated",
      });

      // Performance optimization: Strip notes from ticker data
      // Notes will be loaded on-demand when user clicks on a ticker
      return (output || []).map((watchlist) => ({
        ...watchlist,
        ticker: stripNotesFromTickers(watchlist?.ticker),
      }));
    } catch (e) {
      console.error("Error fetching watchlists:", e);
      return [];
    }
  };

  return {
    getAllWatchlist: await getAllWatchlist(),
  };
};
