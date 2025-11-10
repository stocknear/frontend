export const load = async ({ locals }) => {
  const getHeatMap = async () => {

    const { apiKey, apiURL } = locals;

      const postData = { params: "1D", etf: "SPY" };


   const response = await fetch(apiURL + "/heatmap", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify(postData),
  });

  const output = await response.text();

    return output;
  };

  // Make sure to return a promise
  return {
    getHeatMap: await getHeatMap(),
  };
};
