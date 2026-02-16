import { getAPI } from "$lib/server/api";

export const load = async ({ locals }) => {
  return {
    getPoliticianRSS: await getAPI(locals, "/congress-rss-feed"),
  };
};
