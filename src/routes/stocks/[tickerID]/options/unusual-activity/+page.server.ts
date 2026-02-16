import { postAPI } from "$lib/server/api";

export const load = async ({ locals, params }) => {
  const [data, historicalPrice] = await Promise.all([
    postAPI(locals, "/unusual-activity", { ticker: params.tickerID }),
    postAPI(locals, "/historical-price", { ticker: params.tickerID, timePeriod: "max" }),
  ]);

  return {
    getData: data,
    getHistoricalPrice: historicalPrice,
  };
};
