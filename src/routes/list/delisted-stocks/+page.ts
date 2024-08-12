import { getCache, setCache } from '$lib/store';



export const load = async ({parent}) => {
  const getDelistedStocks = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getDelistedStocks');
    if (cachedData) {
      output = cachedData;
    } else {
      
      const {apiKey, apiURL} = await parent();
      
      const response = await fetch(apiURL + '/delisted-companies', {
        method: 'GET',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
      });

      output = await response.json();

      setCache('', output, 'getDelistedStocks');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getDelistedStocks: await getDelistedStocks()
  };
};