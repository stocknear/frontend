import { postAPI } from "$lib/server/api";

export const load = async ({ locals, setHeaders }) => {
  setHeaders({ "cache-control": "public, max-age=300" });

  return {
    getStocks: await postAPI(locals, "/list-category", { filterList: "highest-option-premium" }),
  };
};
