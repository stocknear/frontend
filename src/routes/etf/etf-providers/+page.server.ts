import { getAPI } from "$lib/server/api";

export const load = async ({ locals }) => {
  let output = await getAPI(locals, "/all-etf-providers");

  for (const item of output) {
    item.name = item?.etfProvider;
  }

  return { getData: output };
};
