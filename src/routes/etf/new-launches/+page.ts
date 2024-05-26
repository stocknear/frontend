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
  const getETFNewLaunches = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getETFNewLaunches');
    if (cachedData) {
      output = cachedData;
    } else {
      

      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/etf-new-launches', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getETFNewLaunches'
      setCache('', output, 'getETFNewLaunches');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getETFNewLaunches: await getETFNewLaunches()
  };
};