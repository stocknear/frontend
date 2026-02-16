export const load = async ({ params, locals }) => {
  const { apiURL, apiKey, user } = locals;

  const getHedgeFundsData = async () => {
    const response = await fetch(apiURL + "/cik-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({ cik: params.slug }),
    });

    const output = await response.json();

    // Filter premium data for non-Plus/Pro users
    // The client-side shows lock icons for these values, but we must not leak actual data
    if (!["Plus", "Pro"].includes(user?.tier)) {
      return {
        ...output,
        // Pro/Plus-only fields - set to null so UI shows lock icons
        winRate: null,
        performancePercentage3Year: null,
      };
    }

    return output;
  };

  return {
    getHedgeFundsData: await getHedgeFundsData(),
    getCIKNumber: params.slug,
  };
};
