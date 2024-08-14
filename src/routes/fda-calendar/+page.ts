import { getCache, setCache } from '$lib/store';



export const load = async ({parent}) => {
  const getFDACalendar = async () => {
    let output;

    const cachedData = getCache('', 'getFDACalendar');
    if (cachedData) {
      output = cachedData;
    } else {
    
    const { apiURL, apiKey} = await parent();

    const response = await fetch(apiURL + '/fda-calendar', {
      method: 'GET',
      headers: {
        "Content-Type": "application/json", "X-API-KEY": apiKey
      },
    });

    output = await response.json();

    setCache('', output, 'getFDACalendar');

    }

    return output;
  };

  // Make sure to return a promise
  return {
    getFDACalendar: await getFDACalendar()
  };
};