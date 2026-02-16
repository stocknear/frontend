import { getAPI } from "$lib/server/api";

export const load = async ({ locals }) => {
  let output = await getAPI(locals, "/sector-overview");

  output = output.map(({ sector, ...rest }) => ({
    ...rest,
    name: sector,
  }));

  return {
    getSectorOverview: output,
  };
};
