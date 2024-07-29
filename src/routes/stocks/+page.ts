import { getCache, setCache } from '$lib/store';


export const load = async ({parent}) => {
  const getStockList = async () => {
    let output;
    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getStockList');
    if (cachedData) {
      output = cachedData;
    } else {
      
      const {apiKey, apiURL} = await parent();
      
      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/all-stock-tickers', {
        method: 'GET',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getStockList'
      setCache('', output, 'getStockList');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getStockList: await getStockList()
  };
};