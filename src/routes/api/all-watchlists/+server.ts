import type { RequestHandler } from "./$types";

type WatchlistTicker = {
  symbol: string;
  note?: string;
  addedPrice?: number | null;
  hasNote?: boolean;
};

export const GET = (async ({ locals }) => {
  const { user, pb } = locals;

  if (!user?.id) {
    return new Response(
      JSON.stringify({ error: "Authentication required" }),
      { status: 401 }
    );
  }

  let output;

  try {
    const watchlists = await pb.collection("watchlist").getFullList({
      filter: `user="${user.id}"`,
    });

    // Strip notes from ticker data to save bandwidth
    // Only return: id, title, ticker (with symbol, addedPrice, hasNote flag)
    output = watchlists.map((watchlist) => {
      let ticker = watchlist.ticker;

      // Parse ticker if it's a string
      if (typeof ticker === "string") {
        try {
          ticker = JSON.parse(ticker);
        } catch {
          ticker = [];
        }
      }

      // Strip notes, only keep symbol, addedPrice, and hasNote flag
      const lightTicker = Array.isArray(ticker)
        ? ticker.map((t: WatchlistTicker) => ({
            symbol: typeof t === "string" ? t : t?.symbol,
            addedPrice: typeof t === "string" ? null : t?.addedPrice ?? null,
            hasNote: typeof t === "string" ? false : Boolean(t?.note && t.note.length > 0),
          }))
        : [];

      return {
        id: watchlist.id,
        title: watchlist.title,
        ticker: lightTicker,
      };
    });
  } catch (e) {
    output = [];
  }

  return new Response(JSON.stringify(output));
}) satisfies RequestHandler;
