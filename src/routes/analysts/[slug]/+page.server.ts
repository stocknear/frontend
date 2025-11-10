
export const load = async ({ locals, params }) => {
  const getData = async () => {
    const { apiURL, apiKey } = locals;

    const postData = { analystId: params.slug };
    // make the POST request to the endpoint
    const response = await fetch(apiURL + "/analyst-stats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(postData),
    });

    let output = await response.json() || {};
    return output;
  };

  // Make sure to return a promise
  return {
    getData: await getData(),
  };
};
