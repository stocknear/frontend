import { postAPI } from "$lib/server/api";

export const load = async ({ params, locals }) => {
  return {
    getETFProviderData: await postAPI(locals, "/etf-provider", { etfProvider: params.slug }),
    getProviderName: params.slug,
  };
};
