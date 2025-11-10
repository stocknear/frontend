export const load = async ({ locals, params }) => {
  const getData = async () => {
    const { apiURL, apiKey } = locals;

    const postData = {
      ticker: params.tickerID,
    };

    const response = await fetch(apiURL + "/business-metrics", {
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
    getData: await getData(),
  };
};
