export const load = async ({ locals }) => {
  const getData = async () => {
    const { apiKey, apiURL } = locals;

    // make the POST request to the endpoint
    const response = await fetch(apiURL + "/etf-new-launches", {
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
    getData: await getData(),
  };
};
