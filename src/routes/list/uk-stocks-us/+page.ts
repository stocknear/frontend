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
  const getUKStocksUS = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getUKStocksUS');
    if (cachedData) {
      output = cachedData;
    } else {
      
      const postData = {'filterList': 'UK'}

      const response = await fetch(apiURL + '/filter-stock-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      output = await response.json();

      setCache('', output, 'getUKStocksUS');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getUKStocksUS: await getUKStocksUS()
  };
};