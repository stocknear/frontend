export const load = async ({ locals, params }) => {
    const { apiKey, apiURL, user } = locals;

  const getData = async () => {
    const postData = {
      ticker: params.tickerID,
    };

    // make the POST request to the endpoint
    const response = await fetch(apiURL + "/price-action-earnings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(postData),
    });

    let output = await response.json();
    output.history = !["Pro", "Plus"]?.includes(user?.tier) ? output?.history?.slice(0,3) : output.history;
    return output;
  };



  // Make sure to return a promise
  return {
    getData: await getData(),
  };
};
