import { userRegion, getCache, setCache } from '$lib/store';


const usRegion = ['cle1','iad1','pdx1','sfo1'];

let apiURL;
let apiKey = import.meta.env.VITE_STOCKNEAR_API_KEY;


userRegion.subscribe(value => {

  if (usRegion.includes(value)) {
    apiURL = import.meta.env.VITE_USEAST_API_URL;
  } else {
    apiURL = import.meta.env.VITE_EU_API_URL;
  }
});



export const load = async () => {
  const getConsumerCyclicalSector = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getConsumerCyclicalSector');
    if (cachedData) {
      output = cachedData;
    } else {
      
      const postData = {'filterList': 'consumer-cyclical'}

      const response = await fetch(apiURL + '/filter-stock-list', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData),
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getConsumerCyclicalSector'
      setCache('', output, 'getConsumerCyclicalSector');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getConsumerCyclicalSector: await getConsumerCyclicalSector()
  };
};