import { getCache, setCache } from '$lib/store';

export const load = async ({parent, params}) => {
  const getIPOCalendar = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache(params.slug, 'getIPOCalendar');
    if (cachedData) {
      output = cachedData;
    } else {

      const data = await parent();
      // make the POST request to the endpoint
      const postData = {'year': params.slug};

      const response = await fetch(data?.apiURL + '/ipo-calendar', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": data?.apiKey
        },
        body: JSON.stringify(postData),
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getIPOCalendar'
      setCache(params.slug, output, 'getIPOCalendar');
    }

    return output;
  };

  const getYear = async() => {
    return params.slug;
  }

  // Make sure to return a promise
  return {
    getIPOCalendar: await getIPOCalendar(),
    getYear: await getYear(),
  };
};