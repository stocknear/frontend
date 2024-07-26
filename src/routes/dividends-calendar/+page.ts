import { getCache, setCache } from '$lib/store';


export const load = async ({parent}) => {
  const getDividendCalendar = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getDividendCalendar');
    if (cachedData) {
      output = cachedData;
    } else {
      
      const data = await parent();
      // make the POST request to the endpoint
      const response = await fetch(data?.apiURL + '/dividends-calendar', {
        method: 'GET',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": data?.apiKey
        },
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getDividendCalendar'
      setCache('', output, 'getDividendCalendar');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getDividendCalendar: await getDividendCalendar()
  };
};