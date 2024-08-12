import {  getCache, setCache } from '$lib/store';




export const load = async ({parent}) => {
  const getETFBitcoinList = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getETFBitcoinList');
    if (cachedData) {
      output = cachedData;
    } else {

      const {apiKey, apiURL} = await parent();
      
      const response = await fetch(apiURL + '/etf-bitcoin-list', {
        method: 'GET',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getETFBitcoinList'
      setCache('', output, 'getETFBitcoinList');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getETFBitcoinList: await getETFBitcoinList()
  };
};