import { postAPI } from "$lib/server/api";

export const load = async ({ locals }) => {
  const [news, ipoCalendar] = await Promise.all([
    postAPI(locals, "/market-news", { newsType: "stock-news" }),
    postAPI(locals, "/ipo-calendar", { year: "all" }),
  ]);

  return {
    getNews: news,
    getIPOCalendar: ipoCalendar,
  };
};
