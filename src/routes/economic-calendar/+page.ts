import { getCache, setCache } from '$lib/store';


export const load = async ({parent}) => {
  const getEconomicCalendar = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getEconomicCalendar');
    if (cachedData) {
      output = cachedData;
    } else {
      
      const { apiURL, apiKey } = await parent();
      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/economic-calendar', {
        method: 'GET',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getEconomicCalendar'
      setCache('', output, 'getEconomicCalendar');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getEconomicCalendar: await getEconomicCalendar()
  };
};