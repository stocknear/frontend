import { postAPI } from "$lib/server/api";

export const load = async ({ locals, params }) => {
  return {
    getIndexCategory: await postAPI(locals, "/list-category", { filterList: params.slug }),
    getParams: params.slug,
  };
};
