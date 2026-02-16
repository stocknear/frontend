import { postAPI } from "$lib/server/api";

export const load = async ({ locals }) => {
  return {
    getMarketMover: await postAPI(locals, "/pre-after-market-movers", { category: "premarket", params: 'gainers' }),
  };
};
