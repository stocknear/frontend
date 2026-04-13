import { postAPI } from "$lib/server/api";

export const load = async ({ locals, params }) => {
  const ticker = params.tickerID;

  const [getData, getEarningsGuidance] = await Promise.all([
    postAPI(locals, "/earnings-statistics", { ticker }),
    postAPI(locals, "/earnings-guidance", { ticker }),
  ]);

  return {
    getData,
    getEarningsGuidance,
  };
};
