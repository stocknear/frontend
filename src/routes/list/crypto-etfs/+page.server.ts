import { getAPI, postAPI } from "$lib/server/api";

export const load = async ({ locals, setHeaders }) => {
  setHeaders({ "cache-control": "public, max-age=3000" });

  const [bitcoinList, ethereumList] = await Promise.all([
    getAPI(locals, "/etf-bitcoin-list"),
    postAPI(locals, "/list-category", { filterList: "ethereum-etfs" }),
  ]);

  return {
    getData: [...bitcoinList, ...ethereumList]
      .sort((a, b) => b?.totalAssets - a?.totalAssets)
      .map((item, index) => ({ ...item, rank: index + 1 })),
  };
};
