import { getAPI } from "$lib/server/api";

export const load = async ({ locals }) => {
  const { user } = locals;
  let output = await getAPI(locals, "/top-analysts");

  output = !["Pro", "Plus"]?.includes(user?.tier) ? output?.reverse()?.slice(0, 6) : output;

  // Rename analystName to name for search worker compatibility
  output = output?.map(({ analystName, ...rest }) => ({
    ...rest,
    name: analystName,
  }));

  return {
    getTopAnalyst: output,
  };
};
