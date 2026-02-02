import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

// Ticker validation: allows ^SPX, AAPL, BRK.A, BTC-USD formats
const TICKER_REGEX = /^[\^]?[A-Z0-9][A-Z0-9.\-]{0,19}$/;
const isValidTicker = (ticker: unknown): ticker is string =>
  typeof ticker === "string" && ticker.length >= 1 && ticker.length <= 20 && TICKER_REGEX.test(ticker.toUpperCase());

export const load: PageServerLoad = async ({ locals, params }) => {
  const { apiKey, apiURL, wsURL, user, pb } = locals;

  // Validate ticker format
  if (!isValidTicker(params.slug)) {
    throw error(404, "Invalid ticker");
  }
  const ticker = params.slug.toUpperCase();

  const payload = JSON.stringify({ ticker });
  const headers = {
    "Content-Type": "application/json",
    "X-API-KEY": apiKey,
  };

  // Check if user has Pro tier for events endpoints
  const isSubscribed = user?.tier === "Pro";

  // Base API calls (always needed)
  const baseFetches = [
    fetch(apiURL + "/historical-adj-price", {
      method: "POST",
      headers,
      body: payload,
    }),
    fetch(apiURL + "/one-day-price", {
      method: "POST",
      headers,
      body: payload,
    }),
    fetch(apiURL + "/stock-quote", {
      method: "POST",
      headers,
      body: payload,
    }),
    fetch(apiURL + "/stockdeck", {
      method: "POST",
      headers,
      body: payload,
    }),
    fetch(apiURL + "/get-asset-type", {
      method: "POST",
      headers,
      body: payload,
    }),
  ];

  const [historicalRes, intradayRes, stockQuoteRes, stockDeckRes, assetTypeRes] =
    await Promise.all(baseFetches);

  let historical = [];
  if (historicalRes.ok) {
    try {
      historical = await historicalRes.json();
    } catch {
      historical = [];
    }
  }

  let intraday = [];
  if (intradayRes.ok) {
    try {
      intraday = await intradayRes.json();
    } catch {
      intraday = [];
    }
  }

  let getStockQuote = {};
  if (stockQuoteRes.ok) {
    try {
      getStockQuote = await stockQuoteRes.json();
    } catch {
      getStockQuote = {};
    }
  }

  let getStockDeck = {};
  if (stockDeckRes.ok) {
    try {
      getStockDeck = await stockDeckRes.json();
    } catch {
      getStockDeck = {};
    }
  }

  let assetType = "";
  if (assetTypeRes.ok) {
    try {
      const typePayload = await assetTypeRes.json();
      assetType =
        typeof typePayload?.assetType === "string"
          ? typePayload.assetType
          : "";
    } catch {
      assetType = "";
    }
  }

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
