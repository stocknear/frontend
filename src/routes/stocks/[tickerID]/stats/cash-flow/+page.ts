import { getCache, setCache } from '$lib/store';


export const load = async ({ parent, params }) => {
  const getCashFlowStatement = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache(params.tickerID, 'getCashFlowStatement');
    if (cachedData) {
      output = cachedData;
    } else {

      const {apiKey, apiURL} = await parent();

      const postData = {
        ticker: params.tickerID
      };

      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/stock-cash-flow', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData)
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getCashFlowStatement'
      setCache(params.tickerID, output, 'getCashFlowStatement');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getCashFlowStatement: await getCashFlowStatement()
  };
};
