import { postAPI } from "$lib/server/api";

export const load = async ({ locals, params, setHeaders }) => {
  setHeaders({ "cache-control": "public, max-age=300" });

  return {
    getData: await postAPI(locals, "/list-category", { filterList: params.slug }),
  };
};
