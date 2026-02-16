import { getAPI } from "$lib/server/api";

export const load = async ({ locals, setHeaders }) => {
  setHeaders({ "cache-control": "public, max-age=3000" });

  return {
    getETFBitcoinList: await getAPI(locals, "/etf-bitcoin-list"),
  };
};
