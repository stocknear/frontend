import { postAPI } from "$lib/server/api";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";

export const load = async ({ locals, params }) => {
  const { user } = locals;
  const ticker = params.tickerID;

  if (!ticker) {
    return { error: 'Invalid ticker ID' };
  }

  try {
    const [bulkData, historyData] = await Promise.all([
      postAPI(locals, "/bulk-data", { ticker, endpoints: ["/unusual-order-level", "/historical-dark-pool"] }),
      postAPI(locals, "/historical-adj-price", { ticker }),
    ]);

    // Process analyst ticker history: if user isn't Pro, limit to 3 items
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
