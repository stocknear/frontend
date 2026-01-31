// Shared server-side watchlist utilities
// Used by stocks, ETF, and index layout.server.ts files

// Type for ticker data (can be string or object)
type TickerData = string | { symbol: string; note?: string; addedPrice?: number | null };

// Type for lightweight watchlist (stripped of notes)
export type LightWatchlist = {
  id: string;
  title: string;
  ticker: string[];
};

/**
 * Extract just the symbols from ticker array (strips notes to save bandwidth)
 * Handles both string format and object format tickers
 */
export function extractSymbolsOnly(tickers: unknown): string[] {
  if (!tickers) return [];

  let tickerArray: TickerData[];

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

  if (!Array.isArray(tickerArray)) return [];

  // Extract just the symbol strings
  return tickerArray
    ?.map((t) => (typeof t === "string" ? t : t?.symbol || ""))
    ?.filter(Boolean);
}

/**
 * Fetch user's watchlists with optimized payload (no notes, just symbols)
 * @param pb - PocketBase instance
 * @param userId - User ID to fetch watchlists for
 * @returns Array of lightweight watchlists
 */
export async function fetchWatchlist(
  pb: any,
  userId: string | undefined
): Promise<LightWatchlist[]> {
  if (!userId) return [];

  try {
    const watchlists = await pb.collection("watchlist").getFullList({
      filter: `user="${userId}"`,
      fields: "id,title,ticker",
    });

    // Transform to lightweight format (symbols only, no notes)
    return watchlists.map((wl: any) => ({
      id: wl.id,
      title: wl.title,
      ticker: extractSymbolsOnly(wl.ticker),
    }));
  } catch {
    return [];
  }
}
