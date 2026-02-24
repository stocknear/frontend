import { postAPI } from "$lib/server/api";

export const load = async ({ locals }) => {
  return {
    getHeatMap: await postAPI(locals, "/heatmap", { params: "1D", etf: "SPY" }),
  };
};
