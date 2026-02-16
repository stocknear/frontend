import { postAPI } from "$lib/server/api";

export const load = async ({ locals, params }) => {
  const { user } = locals;
  const output = await postAPI(locals, "/analyst-stats", { analystId: params.slug }) || {};

  // Filter premium data for non-Plus/Pro users
  if (!["Plus", "Pro"].includes(user?.tier)) {
    return {
      getData: { ...output, successRate: null, avgReturn: null },
    };
  }

  return {
    getData: output,
  };
};
