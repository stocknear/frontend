import { error } from "@sveltejs/kit";
import { postAPI } from "$lib/server/api";
import type { PageServerLoad } from "./$types";

// Ticker validation: allows ^SPX, AAPL, BRK.A, BTC-USD formats
const TICKER_REGEX = /^[\^]?[A-Z0-9][A-Z0-9.\-]{0,19}$/;
const isValidTicker = (ticker: unknown): ticker is string =>
  typeof ticker === "string" && ticker.length >= 1 && ticker.length <= 20 && TICKER_REGEX.test(ticker.toUpperCase());

export const load: PageServerLoad = async ({ locals, params }) => {
  const { wsURL, user, pb } = locals;

  // Validate ticker format
  if (!isValidTicker(params.slug)) {
    throw error(404, "Invalid ticker");
  }
  const ticker = params.slug.toUpperCase();

  // Check if user has Pro tier for events endpoints
  const isSubscribed = user?.tier === "Pro";

  // Base API calls (always needed)
  const [historical, intraday, getStockQuote, getStockDeck, assetTypePayload] = await Promise.all([
    postAPI(locals, "/historical-adj-price", { ticker }).catch(() => []),
    postAPI(locals, "/one-day-price", { ticker }).catch(() => []),
    postAPI(locals, "/stock-quote", { ticker }).catch(() => ({})),
    postAPI(locals, "/stockdeck", { ticker }).catch(() => ({})),
    postAPI(locals, "/get-asset-type", { ticker }).catch(() => ({})),
  ]);

  const assetType = typeof assetTypePayload?.assetType === "string" ? assetTypePayload.assetType : "";

  const getAllStrategies = async () => {
    if (!["Pro"]?.includes(user?.tier)) return [];
    // Validate user ID format (PocketBase uses 15-char alphanumeric IDs)
    if (!user?.id || typeof user.id !== "string" || !/^[a-zA-Z0-9]{15}$/.test(user.id)) {
      return [];
    }

    try {
      const output = await pb.collection("chart").getFullList({
        filter: `user="${user.id}"`,
      });
      output?.sort((a, b) => new Date(b?.updated) - new Date(a?.updated));
      return output;
    } catch {
      return [];
    }
  };

  return {
    ticker,
    historical,
    intraday,
    getStockQuote,
    companyName: getStockDeck?.companyName ?? "",
    assetType,
    wsURL,
    getAllStrategies: await getAllStrategies(),
    isSubscribed,
  };
};
