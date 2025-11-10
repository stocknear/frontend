export const load = async ({ locals }) => {
  const { apiURL, apiKey, user } = locals;


  const getMarketMover = async () => {
    const postData = { category: "premarket", params: 'gainers' };
    const response = await fetch(apiURL + "/pre-after-market-movers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(postData),
    });

    let  output = await response.json();

    return output;
  };

  return {
    getMarketMover: await getMarketMover(),
  };
};
