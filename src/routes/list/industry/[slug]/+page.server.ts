import { postAPI } from "$lib/server/api";

export const load = async ({ locals, params, setHeaders }) => {
  setHeaders({ "cache-control": "public, max-age=3000" });

  return {
    getParams: params.slug,
    getIndustryStocks: await postAPI(locals, "/industry-stocks", { filterList: params.slug }),
  };
};
