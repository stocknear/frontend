import { getCache, setCache } from '$lib/store';


export const load = async ({parent}) => {
  const getEarningsCalendar = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getEarningsCalendar');
    if (cachedData) {
      output = cachedData;
    } else {
      
      const {apiKey, apiURL} = await parent();
      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/earnings-calendar', {
        method: 'GET',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getEarningsCalendar'
      setCache('', output, 'getEarningsCalendar');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getEarningsCalendar: await getEarningsCalendar()
  };
};