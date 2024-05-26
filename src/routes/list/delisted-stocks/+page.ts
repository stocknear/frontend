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


export const load = async () => {
  const getDelistedStocks = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getDelistedStocks');
    if (cachedData) {
      output = cachedData;
    } else {
      

      const response = await fetch(apiURL + '/delisted-companies', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
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