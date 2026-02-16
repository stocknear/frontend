import { getAPI } from "$lib/server/api";

export const load = async ({ locals }) => {
  return {
    getData: await getAPI(locals, "/insider-tracker"),
  };
};
