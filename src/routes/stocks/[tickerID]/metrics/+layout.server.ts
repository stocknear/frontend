import { postAPI } from "$lib/server/api";

export const load = async ({ locals, params }) => {
  return {
    getData: await postAPI(locals, "/business-metrics", { ticker: params.tickerID }),
  };
};
