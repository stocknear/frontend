import { postAPI } from "$lib/server/api";

export const load = async ({ locals, params }) => {
  let output = await postAPI(locals, "/price-action-earnings", { ticker: params.tickerID });
  output.history = !["Pro", "Plus"]?.includes(locals.user?.tier) ? output?.history?.slice(0,3) : output.history;

  return { getData: output };
};
