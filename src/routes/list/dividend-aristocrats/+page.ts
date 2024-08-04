import { getCache, setCache } from '$lib/store';



export const load = async ({parent}) => {
  const getDividendAristocrats = async () => {

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getDividendAristocrats');
    if (cachedData) {
      return cachedData;
    } else {
      
      const { apiKey, apiURL} = await parent();

      const response = await fetch(apiURL + '/dividend-aristocrats', {
        method: 'GET',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
      });


      const output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getDividendAristocrats'
      setCache('', output, 'getDividendAristocrats');

      return output;
    }
  };

  // Make sure to return a promise
  return {
    getDividendAristocrats: await getDividendAristocrats()
  };
};