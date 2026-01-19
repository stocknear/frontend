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

    const output = await response.json();

    return output;
  };

  return {
    getHeatMap: await getHeatMap(),
  };
};
