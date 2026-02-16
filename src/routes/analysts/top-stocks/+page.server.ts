import { getAPI } from "$lib/server/api";

export const load = async ({ locals }) => {
  const { user } = locals;
  let output = await getAPI(locals, "/top-analysts-stocks");

  output = !["Pro", "Plus"]?.includes(user?.tier) ? output?.reverse()?.slice(0, 6) : output;

  return {
    getTopAnalystStocks: output,
  };
};
