import { postAPI } from "$lib/server/api";

export const load = async ({ locals, params }) => {
  const ticker = params.tickerID;

  const [priceAnalysis, historicalPrice, aiScore] = await Promise.all([
    postAPI(locals, "/price-analysis", { ticker }),
    postAPI(locals, "/historical-price", { ticker, timePeriod: "max" }),
    postAPI(locals, "/ai-score", { ticker }),
  ]);

  return {
    getPriceAnalysis: priceAnalysis,
    getHistoricalPrice: historicalPrice,
    getAIScore: aiScore,
  };
};
