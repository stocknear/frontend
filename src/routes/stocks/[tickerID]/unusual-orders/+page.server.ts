import { error, redirect } from "@sveltejs/kit";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";


export const load = async ({ locals, params }) => {
  const { apiURL, apiKey, user } = locals;
  const ticker = params.tickerID;

  if (!ticker) {
    return { error: 'Invalid ticker ID' };
  }

  // Define the endpoints you want to fetch in bulk
  const endpoints = [
    "/unusual-order-level",
    "/historical-dark-pool",
  ];

  // Prepare the payload for the bulk request
  const postData = {
    ticker,
    endpoints
  };

  try {
    // Fetch bulk data and historical price data in parallel
    const [bulkResponse, historyResponse] = await Promise.all([
      fetch(`${apiURL}/bulk-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
        body: JSON.stringify(postData),
      }),
      fetch(`${apiURL}/historical-adj-price`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
        body: JSON.stringify({ ticker }),
      }),
    ]);

    if (!bulkResponse.ok) {
      throw new Error("Failed to fetch bulk data");
    }

    const bulkData = await bulkResponse.json();
    const historyData = historyResponse.ok ? await historyResponse.json() : [];

    // Process analyst ticker history: if user isn't Pro, limit to 6 items
    let priceLevel = bulkData["/unusual-order-level"];
    if (user?.tier !== "Pro") {
      priceLevel.hottestTrades = priceLevel?.hottestTrades?.slice(0, 3);
    }

    // Get last 90 days of price history for context
    const recentHistory = Array.isArray(historyData)
      ? historyData.slice(-90)
      : [];

    return {
      getPriceLevel: priceLevel,
      getHistoricalDarkPool: bulkData["/historical-dark-pool"],
      getPriceHistory: recentHistory,
    };
  } catch (error) {
    return { error: "Failed to load data" };
  }
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
