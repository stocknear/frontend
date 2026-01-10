import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const { apiURL, apiKey } = locals;

  const headers = {
    "Content-Type": "application/json",
    "X-API-KEY": apiKey,
  };

  // Fetch SPY intraday data for the preview chart
  let spyIntraday: any[] = [];
  try {
    const response = await fetch(apiURL + "/one-day-price", {
      method: "POST",
      headers,
      body: JSON.stringify({ ticker: "SPY" }),
    });
    if (response.ok) {
      spyIntraday = await response.json();
    }
  } catch {
    spyIntraday = [];
  }

  return {
    spyIntraday,
  };
};
