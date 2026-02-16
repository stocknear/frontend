import { getAPI } from "$lib/server/api";

export const load = async ({ locals }) => {
  return {
    getEarningsCalendar: await getAPI(locals, "/earnings-calendar"),
  };
};
