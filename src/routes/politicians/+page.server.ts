import { getAPI } from "$lib/server/api";

// Helper function to filter premium fields from politician items
function filterPremiumFields(items: any[]): any[] {
  return items?.map((item) => ({
    ...item,
    successRate: null,
    avgReturn: null,
  })) ?? [];
}

export const load = async ({ locals }) => {
  const isPremium = ["Plus", "Pro"].includes(locals.user?.tier);

  let output = await getAPI(locals, "/all-politicians");

  // Filter premium data for non-Plus/Pro users
  if (!isPremium && Array.isArray(output)) {
    output = filterPremiumFields(output);
  }

  return { getAllPolitician: output };
};
