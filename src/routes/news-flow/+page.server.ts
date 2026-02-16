import { getAPI } from "$lib/server/api";

export const load = async ({ locals }) => {
  const { user } = locals;
  let output = await getAPI(locals, "/news-flow");
  const totalItems = output?.length;
  output = user?.tier === "Pro" ? output : output?.slice(0, 5);

  return {
    getData: { output, totalItems },
  };
};
