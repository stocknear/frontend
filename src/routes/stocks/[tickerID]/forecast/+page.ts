import { getCache, setCache } from "$lib/store";

export const load = async ({ parent, params }) => {
  const getAnalystEstimate = async () => {
    let output;

    const cachedData = getCache(params.tickerID, "getAnalystEstimate");
    if (cachedData) {
      output = cachedData;
    } else {
      const { apiURL, apiKey } = await parent();

      const postData = {
        ticker: params.tickerID,
      };

      // make the POST request to the endpoint
      const response = await fetch(apiURL + "/analyst-estimate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
        body: JSON.stringify(postData),
      });

      output = await response.json();

      setCache(params.tickerID, output, "getAnalystEstimate");
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getAnalystEstimate: await getAnalystEstimate(),
  };
};
