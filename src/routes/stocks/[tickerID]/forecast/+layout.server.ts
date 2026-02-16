import { postAPI } from "$lib/server/api";

export const load = async ({ locals, params }) => {
  const { user, locale } = locals;
  const ticker = params.tickerID;

  if (!ticker) {
    return { error: 'Invalid ticker ID' };
  }

  try {
    const bulkData = await postAPI(locals, "/bulk-data", {
      ticker,
      endpoints: [
        "/analyst-ticker-history",
        "/analyst-estimate",
        "/analyst-insight",
        "/top-analyst-summary-rating"
      ],
      lang: locale ?? 'en'
    });

    // Process analyst ticker history: if user isn't Pro, limit to 6 items
    let analystTickerHistory = bulkData["/analyst-ticker-history"];
    if (user?.tier !== "Pro" && Array.isArray(analystTickerHistory)) {
      analystTickerHistory = analystTickerHistory.slice(0, 6);
    }

    return {
      getAnalystTickerHistory: analystTickerHistory,
      getAnalystEstimate: bulkData["/analyst-estimate"],
      getAnalystInsight: bulkData["/analyst-insight"],
      getTopAnalystSummary: bulkData["/top-analyst-summary-rating"],
    };
  } catch (error) {
    return { error: "Failed to load data" };
  }
};
