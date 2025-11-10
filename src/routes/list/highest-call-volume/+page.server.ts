export const load = async ({ locals }) => {

  const getStocks = async () => {
    const { apiKey, apiURL } = locals;
    const postData = { filterList: 'highest-call-volume' };

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
    getStocks: await getStocks(),
  };
};
