import { postAPI } from "$lib/server/api";

export const load = async ({ locals, params }) => {
  return {
    getSimilarStocks: await postAPI(locals, "/similar-stocks", { ticker: params.tickerID }),
  };
};
