import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { apiKey, apiURL, wsURL, user, pb } = locals;
  const ticker = params.slug?.toUpperCase();

  if (!ticker) {
    throw error(404, "Ticker not found");
  }

  const payload = JSON.stringify({ ticker });
  const headers = {
    "Content-Type": "application/json",
    "X-API-KEY": apiKey,
  };

  const [historicalRes, intradayRes, stockQuoteRes, stockDeckRes, assetTypeRes, earningsRes, nextEarningsRes] =
    await Promise.all([
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
    fetch(apiURL + "/earnings-statistics", {
      method: "POST",
      headers,
      body: payload,
    }),
    fetch(apiURL + "/next-earnings", {
      method: "POST",
      headers,
      body: payload,
    }),
  ]);

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

  let historicalEarnings: any[] = [];
  if (earningsRes.ok) {
    try {
      const earningsPayload = await earningsRes.json();
      historicalEarnings = earningsPayload?.historicalEarnings ?? [];
    } catch {
      historicalEarnings = [];
    }
  }

  let nextEarnings: any = null;
  if (nextEarningsRes.ok) {
    try {
      nextEarnings = await nextEarningsRes.json();
    } catch {
      nextEarnings = null;
    }
  }

  const getAllStrategies = async () => {
    if (!user) return [];
    try {
      const output = await pb.collection("chart").getFullList({
        filter: `user="${user?.id}"`,
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
    historicalEarnings,
    nextEarnings,
  };
};
