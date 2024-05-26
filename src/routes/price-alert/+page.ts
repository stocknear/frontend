import { userRegion, getCache, setCache } from '$lib/store';


const usRegion = ['cle1','iad1','pdx1','sfo1'];

let apiURL;

userRegion?.subscribe(value => {

  if (usRegion?.includes(value)) {
    apiURL = import.meta.env.VITE_USEAST_API_URL;
  } else {
    apiURL = import.meta.env.VITE_EU_API_URL;
  }
});



export const load = async () => {

  const getMiniPlotsIndex = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getMiniPlotsIndex');
    if (cachedData) {
      output = cachedData;
    } else {

      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/mini-plots-index', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      output = await response.json();

      setCache('', output, 'getMiniPlotsIndex');
    }

    return output;
  };





  // Make sure to return a promise
  return {
    getMiniPlotsIndex: await getMiniPlotsIndex(),
  };
};