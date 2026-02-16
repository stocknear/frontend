import { getAPI } from "$lib/server/api";

export const load = async ({ locals }) => {
  return {
    getEconomicCalendar: await getAPI(locals, "/economic-calendar"),
  };
};
