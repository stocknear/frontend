import { postAPI } from "$lib/server/api";

export const load = async ({ locals, setHeaders }) => {
  setHeaders({ "cache-control": "public, max-age=300" });

  return {
    getPennyStocks: await postAPI(locals, "/list-category", { filterList: "penny-stocks" }),
  };
};
