import { postAPI } from "$lib/server/api";

export const load = async ({ locals, params }) => {
  return {
    getData: await postAPI(locals, "/earnings-statistics", { ticker: params.tickerID }),
  };
};
