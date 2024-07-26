import {getCache, setCache } from '$lib/store';



export const load = async ({parent}) => {

  const getCramerTracker = async () => {
    let output;
    const data = await parent();

    const cachedData = getCache('', 'getCramerTracker');
    if (cachedData) {
      output = cachedData;
    } else {
    // make the POST request to the endpoint
    const response = await fetch(data?.apiURL + '/cramer-tracker', {
      method: 'GET',
      headers: {
        "Content-Type": "application/json", "X-API-KEY": data?.apiKey
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