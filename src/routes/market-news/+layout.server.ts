import { postAPI } from "$lib/server/api";

export const load = async ({ locals }) => {
  const [stockNews, marketNews, pressNews] = await Promise.all([
    postAPI(locals, "/market-news", { newsType: "stock-news" }),
    postAPI(locals, "/market-news", { newsType: "general-news" }),
    postAPI(locals, "/market-news", { newsType: "press-news" }),
  ]);

  return {
    getStockNews: stockNews,
    getMarketNews: marketNews,
    getPressNews: pressNews,
  };
};
