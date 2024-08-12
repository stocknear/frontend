import { getCache, setCache } from '$lib/store';





export const load = async ({parent}) => {
  const getSPConstituentsStocks = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getSPConstituentsStocks');
    if (cachedData) {
      output = cachedData;
    } else {
      
      const {apiURL, apiKey} = await parent();
      
      const postData = {'filterList': 'sp500Constituent'}

      const response = await fetch(apiURL + '/exchange-constituents', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData),
      });

      output = await response.json();

      setCache('', output, 'getSPConstituentsStocks');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getSPConstituentsStocks: await getSPConstituentsStocks()
  };
};