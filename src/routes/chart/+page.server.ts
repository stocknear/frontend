import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const { apiURL, apiKey } = locals;

  const headers = {
    "Content-Type": "application/json",
    "X-API-KEY": apiKey,
  };

  const fetchMovers = async (type: string) => {
    try {
      const response = await fetch(apiURL + "/market-movers", {
        method: "POST",
        headers,
        body: JSON.stringify({ params: type }),
      });
      if (!response.ok) return [];
      const data = await response.json();
      // Return top 5 from the 1D data
      return (data?.["1D"] ?? []).slice(0, 5);
    } catch {
      return [];
    }
  };

  const [gainers, losers, active] = await Promise.all([
    fetchMovers("gainers"),
    fetchMovers("losers"),
    fetchMovers("active"),
  ]);

  return {
    gainers,
    losers,
    active,
  };
};
