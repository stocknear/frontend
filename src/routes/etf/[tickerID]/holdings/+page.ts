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
  const getETFHoldings = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache(params.tickerID, 'getETFHoldings');
    if (cachedData) {
      output = cachedData;
    } else {
      const postData = {
        ticker: params.tickerID
      };

      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/etf-holdings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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