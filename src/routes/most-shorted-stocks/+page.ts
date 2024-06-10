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


export const load = async ({parent}) => {
  const getMostShortedStocks = async () => {
    let output;
    const data = await parent();

    const cachedData = getCache('', 'getMostShortedStocks');
    if (cachedData) {
      output = cachedData;
    } else {
    // make the POST request to the endpoint
    const response = await fetch(apiURL + '/most-shorted-stocks', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    output = await response.json();

    setCache('', output, 'getMostShortedStocks');

    }

    return output;
  };

  // Make sure to return a promise
  return {
    getMostShortedStocks: await getMostShortedStocks()
  };
};