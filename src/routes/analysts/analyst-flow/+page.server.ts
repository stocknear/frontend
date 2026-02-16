import { getAPI } from "$lib/server/api";

export const load = async ({ locals }) => {
  const { user } = locals;
  let output = await getAPI(locals, "/analyst-flow");
  const isPremiumUser = ["Pro", "Plus"].includes(user?.tier);
  output = isPremiumUser ? output : output?.slice(0, 6);

  return {
    getData: output,
  };
};
