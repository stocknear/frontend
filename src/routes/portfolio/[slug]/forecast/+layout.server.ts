export const load = async ({ locals, params }) => {
  const { apiURL, apiKey, user } = locals;
  const ticker = params.tickerID;

  if (!ticker) {
    return { error: 'Invalid ticker ID' };
  }

  // Define the endpoints you want to fetch in bulk
  const endpoints = [
    "/analyst-ticker-history",
    "/analyst-estimate",
    "/analyst-insight",
    "/top-analyst-summary-rating"
  ];

  // Prepare the payload for the bulk request
  const postData = {
    ticker,
    endpoints
  };

  try {
    const response = await fetch(`${apiURL}/bulk-data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch bulk data");
    }

    const bulkData = await response.json();

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
