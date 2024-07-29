import { getCache, setCache } from '$lib/store';



export const load = async ({ parent, params }) => {
  const getETFHoldings = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache(params.tickerID, 'getETFHoldings');
    if (cachedData) {
      output = cachedData;
    } else {
      const {apiKey, apiURL} = await parent();
      const postData = {
        ticker: params.tickerID
      };

      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/etf-holdings', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData)
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getETFHoldings'
      setCache(params.tickerID, output, 'getETFHoldings');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getETFHoldings: await getETFHoldings()
  };
};