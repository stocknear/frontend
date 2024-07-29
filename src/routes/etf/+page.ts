import {  getCache, setCache } from '$lib/store';



export const load = async ({parent}) => {
  const getETFList = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getETFList');
    if (cachedData) {
      output = cachedData;
    } else {
      
      const {apiKey, apiURL} = await parent();
      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/all-etf-tickers', {
        method: 'GET',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getETFList'
      setCache('', output, 'getETFList');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getETFList: await getETFList()
  };
};