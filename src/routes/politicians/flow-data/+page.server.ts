export const load = async ({ locals }) => {
  const getPoliticianRSS = async () => {
    const { apiKey, apiURL } = locals;

    const response = await fetch(apiURL + "/congress-rss-feed", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    });

    // Data is now pre-processed in the backend with party, performanceScore, and performanceRank
    const output = await response.json();

    return output;
  };

  // Make sure to return a promise
  return {
    getPoliticianRSS: await getPoliticianRSS(),
  };
};
