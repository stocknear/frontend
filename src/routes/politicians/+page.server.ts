// Helper function to filter premium fields from politician items
function filterPremiumFields(items: any[]): any[] {
  return items?.map((item) => ({
    ...item,
    successRate: null,
    avgReturn: null,
  })) ?? [];
}

export const load = async ({ locals }) => {
  const { apiKey, apiURL, user } = locals;
  const isPremium = ["Plus", "Pro"].includes(user?.tier);

  const getAllPolitician = async () => {
    const response = await fetch(apiURL + "/all-politicians", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    });

    // Data is now pre-processed in the backend with party, filtered by performanceRank > 0, and sorted
    let output = await response.json();

    // Filter premium data for non-Plus/Pro users
    if (!isPremium && Array.isArray(output)) {
      output = filterPremiumFields(output);
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getAllPolitician: await getAllPolitician(),
  };
};
