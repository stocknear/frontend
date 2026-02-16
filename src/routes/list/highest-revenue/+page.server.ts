import { postAPI } from "$lib/server/api";

export const load = async ({ locals, setHeaders }) => {
  setHeaders({ "cache-control": "public, max-age=3000" });

  return {
    getData: await postAPI(locals, "/list-category", { filterList: "highest-revenue" }),
  };
};
