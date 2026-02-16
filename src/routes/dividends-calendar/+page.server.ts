import { getAPI } from "$lib/server/api";

export const load = async ({ locals, setHeaders }) => {
  setHeaders({ "cache-control": "public, max-age=3000" });

  return {
    getDividendCalendar: await getAPI(locals, "/dividends-calendar"),
  };
};
