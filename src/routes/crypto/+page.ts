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
  const getCryptoList = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getCryptoList');
    if (cachedData) {
      output = cachedData;
    } else {
      

      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/all-crypto-tickers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      output = (await response.json())?.sort((a, b) => b?.marketCap - a?.marketCap);

      // Cache the data for this specific tickerID with a specific name 'getCryptoList'
      setCache('', output, 'getCryptoList');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getCryptoList: await getCryptoList()
  };
};