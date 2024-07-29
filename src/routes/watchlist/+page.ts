import { getCache, setCache } from '$lib/store';



export const load = async ({parent}) => {

  const getMiniPlotsIndex = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getMiniPlotsIndex');
    if (cachedData) {
      output = cachedData;
    } else {
      const {apiKey, apiURL} = await parent();

      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/mini-plots-index', {
        method: 'GET',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
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