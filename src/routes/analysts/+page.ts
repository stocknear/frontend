import {getCache, setCache } from '$lib/store';



export const load = async ({parent}) => {

  const getTopAnalyst = async () => {
    const { apiURL, apiKey, user} = await parent();

    let output;

    const cachedData = getCache('', 'getTopAnalyst');
    if (cachedData) {
      output = cachedData;
    } else {

      const response = await fetch(apiURL + '/top-analysts', {
        method: 'GET',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
      });

      output = await response?.json();
       setCache('', output, 'getTopAnalyst');
    }
    
    output = user?.tier !== 'Pro' ? output?.reverse()?.slice(0,6) : output;

    return output;
  };

  // Make sure to return a promise
  return {
    getTopAnalyst: await getTopAnalyst()
  };
};