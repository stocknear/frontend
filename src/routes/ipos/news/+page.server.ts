import { postAPI } from "$lib/server/api";

export const load = async ({ locals }) => {
  return {
    getStockNews: await postAPI(locals, "/market-news", { newsType: "stock-news" }),
  };
};
