import { getCache, setCache } from '$lib/store';


export const load = async ({parent}) => {
  const getUtilitiesSector = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getUtilitiesSector');
    if (cachedData) {
      output = cachedData;
    } else {
      
      const {apiKey, apiURL} = await parent();
      
      const postData = {'filterList': 'utilities'}

      const response = await fetch(apiURL + '/filter-stock-list', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData),
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getUtilitiesSector'
      setCache('', output, 'getUtilitiesSector');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getUtilitiesSector: await getUtilitiesSector()
  };
};