import { postAPI } from "$lib/server/api";

export const load = async ({ locals, params }) => {
  return {
    getData: await postAPI(locals, "/options-gex-dex", { params: params.tickerID, category: "expiry", type: "dex" }),
  };
};
