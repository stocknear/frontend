export const load = async ({ locals }) => {
  const getIndustryOverview = async () => {
    const { apiKey, apiURL } = locals;

    const response = await fetch(apiURL + "/industry-overview", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    });

    const output = await response.json();

    return output;
  };

  // Make sure to return a promise
  return {
    getIndustryOverview: await getIndustryOverview(),
  };
};
