import { postAPI } from "$lib/server/api";

export const load = async ({ locals, params }) => {
  return {
    getHistoricalMarketCap: await postAPI(locals, "/historical-market-cap", { ticker: params.tickerID }),
  };
};
