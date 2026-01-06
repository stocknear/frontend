export const load = async ({ locals }) => {
  const getSectorOverview = async () => {
    const { apiKey, apiURL } = locals;

    const response = await fetch(apiURL + "/sector-overview", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    });

    let output = await response.json();

       output = output.map(({ sector, ...rest }) => ({
      ...rest,
      name: sector,
    }));

    return output;
  };

  // Make sure to return a promise
  return {
    getSectorOverview: await getSectorOverview(),
  };
};
