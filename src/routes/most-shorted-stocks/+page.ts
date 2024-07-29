import { getCache, setCache } from '$lib/store';



export const load = async ({parent}) => {
  const getMostShortedStocks = async () => {
    let output;
    const {apiKey, apiURL, user} = await parent();

    const cachedData = getCache('', 'getMostShortedStocks');
    if (cachedData) {
      output = cachedData;
    } else {
    const response = await fetch(apiURL + '/most-shorted-stocks', {
      method: 'GET',
      headers: {
        "Content-Type": "application/json", "X-API-KEY": apiKey
      },
    });

    output = await response.json();

    output = user?.tier !== 'Pro' ? output?.slice(0,6) : output;

    setCache('', output, 'getMostShortedStocks');

    }

    return output;
  };

  // Make sure to return a promise
  return {
    getMostShortedStocks: await getMostShortedStocks()
  };
};