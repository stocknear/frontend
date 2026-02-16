import { postAPI } from "$lib/server/api";

export const load = async ({ params, locals }) => {
  const { user } = locals;

  const output = await postAPI(locals, "/cik-data", { cik: params.slug });

  // Filter premium data for non-Plus/Pro users
  const getHedgeFundsData = !["Plus", "Pro"].includes(user?.tier)
    ? { ...output, winRate: null, performancePercentage3Year: null }
    : output;

  return {
    getHedgeFundsData,
    getCIKNumber: params.slug,
  };
};
