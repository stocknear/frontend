import { postAPI } from "$lib/server/api";

export const load = async ({ locals, setHeaders }) => {
  setHeaders({ "cache-control": "public, max-age=3000" });

  return {
    getStocks: await postAPI(locals, "/list-category", { filterList: "most-shorted-stocks" }),
  };
};
