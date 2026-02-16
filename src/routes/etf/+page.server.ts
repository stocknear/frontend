import { postAPI } from "$lib/server/api";

export const load = async ({ locals }) => {
  return {
    getStockList: await postAPI(locals, "/list-category", { filterList: "all-etf-tickers" }),
  };
};
