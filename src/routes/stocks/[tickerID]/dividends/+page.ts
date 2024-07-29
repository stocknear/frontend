import { getCache, setCache } from '$lib/store';


export const load = async ({ parent, params }) => {
  const getStockDividend = async () => {
    let newsList;

    // Get cached data for the specific tickerID
    const cachedData = getCache(params.tickerID, 'getStockDividend');
    if (cachedData) {
      newsList = cachedData;
    } else {

      const {apiURL, apiKey} = await parent();

      const postData = {
        ticker: params.tickerID
      };

      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/stock-dividend', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData)
      });

      newsList = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getStockDividend'
      setCache(params.tickerID, newsList, 'getStockDividend');
    }

    return newsList;
  };

  // Make sure to return a promise
  return {
    getStockDividend: await getStockDividend()
  };
};
