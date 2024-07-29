import { getCache, setCache } from '$lib/store';


export const load = async ({parent, params}) => {
  const getAnalystStats = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache(params.slug, 'getAnalystStats');
    if (cachedData) {
      output = cachedData;
    } else {

      const { apiURL, apiKey} = await parent();

        const postData = {'analystId': params.slug}
      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/analyst-stats', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData)
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getAnalystStats'
      setCache(params.slug, output, 'getAnalystStats');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getAnalystStats: await getAnalystStats()
  };
};