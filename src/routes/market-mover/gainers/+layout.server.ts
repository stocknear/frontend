import { postAPI } from "$lib/server/api";

export const load = async ({ locals }) => {
  return {
    getMarketMover: await postAPI(locals, "/market-movers", { params: 'gainers' }),
  };
};
