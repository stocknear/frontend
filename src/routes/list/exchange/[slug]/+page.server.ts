import { postAPI } from "$lib/server/api";

export const load = async ({ locals, params }) => {
  return {
    getExchangeCategory: await postAPI(locals, "/list-category", { filterList: params.slug }),
    getParams: params.slug,
  };
};
