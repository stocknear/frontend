import { postAPI } from "$lib/server/api";

export const load = async ({ locals, params }) => {
  return {
    getData: await postAPI(locals, "/options-oi", { params: params.tickerID, category: "strike" }),
  };
};
