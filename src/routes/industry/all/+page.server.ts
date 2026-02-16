import { getAPI } from "$lib/server/api";

export const load = async ({ locals }) => {
  let output = await getAPI(locals, "/industry-overview");

  output = output.map(({ industry, ...rest }) => ({
    ...rest,
    name: industry,
  }));

  return {
    getIndustryOverview: output,
  };
};
