import {  getCache, setCache } from '$lib/store';



export const load = async ({parent}) => {
  const getMostRetailVolume = async () => {
    let output;
    const {apiKey, apiURL, user} = await parent();


    const cachedData = getCache('', 'getMostRetailVolume');
    if (cachedData) {
      output = cachedData;
    } else {
    // make the POST request to the endpoint
    const response = await fetch(apiURL + '/most-retail-volume', {
      method: 'GET',
      headers: {
        "Content-Type": "application/json", "X-API-KEY": apiKey
      },
    });

    output = await response.json();

    output = user?.tier !== 'Pro' ? output?.slice(0,6) : output;

    setCache('', output, 'getMostRetailVolume');

    }

    return output;
  };

  // Make sure to return a promise
  return {
    getMostRetailVolume: await getMostRetailVolume()
  };
};