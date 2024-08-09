import {getCache, setCache } from '$lib/store';



export const load = async ({parent}) => {

  const getCramerTracker = async () => {
    let output;

    const cachedData = getCache('', 'getCramerTracker');
    if (cachedData) {
      output = cachedData;
    } else {
    
    const { apiKey, apiURL } = await parent();

    const response = await fetch(apiURL + '/lobbying-tracker', {
      method: 'GET',
      headers: {
        "Content-Type": "application/json", "X-API-KEY": apiKey
      },
    });

    output = await response.json();

    setCache('', output, 'getCramerTracker');

    }

    //output = data?.user?.tier !== 'Pro' ? output?.slice(0,6) : output;

    return output;
  };

  // Make sure to return a promise
  return {
    getCramerTracker: await getCramerTracker()
  };
};