export const load = async ({ locals }) => {

  const getOverBoughtStocks = async () => {
    const { apiKey, apiURL } = locals;
    const postData = { filterList: 'overbought-stocks' };

    const response = await fetch(apiURL + "/list-category", {
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

  // Make sure to return a promise
  return {
    getOverBoughtStocks: await getOverBoughtStocks(),
  };
};
