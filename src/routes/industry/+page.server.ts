import { getAPI } from "$lib/server/api";

export const load = async ({ locals }) => {
  return {
    getSectorIndustryOverview: await getAPI(locals, "/sector-industry-overview"),
  };
};
