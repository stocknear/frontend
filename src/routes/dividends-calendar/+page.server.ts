import { getAPI } from "$lib/server/api";

export const load = async ({ locals, setHeaders }) => {
  setHeaders({ "cache-control": "public, max-age=300" });

  return {
    getDividendCalendar: await getAPI(locals, "/dividends-calendar"),
  };
};
