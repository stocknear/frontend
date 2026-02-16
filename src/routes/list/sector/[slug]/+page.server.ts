import { postAPI } from "$lib/server/api";

export const load = async ({ locals, params }) => {
  return {
    getParams: params.slug,
    getSectorCategory: await postAPI(locals, "/list-category", { filterList: params.slug }),
  };
};
