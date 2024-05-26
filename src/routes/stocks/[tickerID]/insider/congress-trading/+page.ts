import { userRegion, getCache, setCache } from '$lib/store';

const usRegion = ['cle1','iad1','pdx1','sfo1'];

let apiURL;

userRegion.subscribe(value => {

  if (usRegion.includes(value)) {
    apiURL = import.meta.env.VITE_USEAST_API_URL;
  } else {
    apiURL = import.meta.env.VITE_EU_API_URL;
  }
});




export const load = async ({ params }) => {
  const getSenateTrading = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache(params.tickerID, 'getSenateTrading');
    if (cachedData) {
      output = cachedData;
    } else {
      const postData = {
        ticker: params.tickerID
      };

      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/congress-trading-ticker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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