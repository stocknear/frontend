import { postAPI } from "$lib/server/api";

export const load = async ({ locals }) => {
  return {
    getETFHeatMap: await postAPI(locals, "/etf-heatmap", { params: "1D" }),
  };
};
