import { getCache, setCache } from '$lib/store';



export const load = async ({ parent, params }) => {
  const getSenateTrading = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache(params.tickerID, 'getSenateTrading');
    if (cachedData) {
      output = cachedData;
    } else {

      const data = await parent();

      const postData = {
        ticker: params.tickerID
      };

      // make the POST request to the endpoint
      const response = await fetch(data?.apiURL + '/congress-trading-ticker', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": data?.apiKey
        },
        body: JSON.stringify(postData)
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getSenateTrading'
      setCache(params.tickerID, output, 'getSenateTrading');
    }


  
  

    return output;
  };

  // Make sure to return a promise
  return {
    getSenateTrading: await getSenateTrading()
  };
};