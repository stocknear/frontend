export const load = async ({ locals, params }) => {
  const getData = async () => {
    const { apiKey, apiURL } = locals;
    const postData = {
      ticker: params.tickerID,
    };

    // make the POST request to the endpoint
    const response = await fetch(apiURL + "/fail-to-deliver", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(postData),
    });

    const output = await response.json();
    if (Array.isArray(output)) {
      output.sort((a, b) => new Date(a?.date) - new Date(b?.date));
    }
    return output;

  };

  

  // Make sure to return a promise
  return {
    getData: await getData(),
  };
};
