import { postAPI } from "$lib/server/api";

export const load = async ({ locals, params }) => {
  return {
    getProfileData: await postAPI(locals, "/profile", { ticker: params.tickerID }),
  };
};
