export const load = async ({ locals }) => {
  const getETFBitcoinList = async () => {
    const { apiKey, apiURL } = locals;

    const response = await fetch(apiURL + "/etf-bitcoin-list", {
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
    getETFBitcoinList: await getETFBitcoinList(),
  };
};
