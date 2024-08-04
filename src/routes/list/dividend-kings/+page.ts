import { getCache, setCache } from '$lib/store';



export const load = async ({parent}) => {
  const getDividendKings = async () => {

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getDividendKings');
    if (cachedData) {
      return cachedData;
    } else {
      
      const { apiKey, apiURL} = await parent();

      const response = await fetch(apiURL + '/dividend-kings', {
        method: 'GET',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
      });


      const output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getDividendKings'
      setCache('', output, 'getDividendKings');

      return output;
    }
  };

  // Make sure to return a promise
  return {
    getDividendKings: await getDividendKings()
  };
};