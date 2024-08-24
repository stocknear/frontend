import { getCache, setCache } from '$lib/store';



export const load = async ({parent}) => {
  const getTechnologySector = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getTechnologySector');
    if (cachedData) {
      output = cachedData;
    } else {
      
      const {apiKey, apiURL} = await parent();
      
      const postData = {'filterList': 'technology'}

      const response = await fetch(apiURL + '/filter-stock-list', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData),
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getTechnologySector'
      setCache('', output, 'getTechnologySector');
    }

    return output;
  };

  const getHistoricalSector = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('technology', 'getHistoricalSector');
    if (cachedData) {
      output = cachedData;
    } else {
      
      const {apiKey, apiURL} = await parent();
      
      const postData = {'filterList': 'technology'}

      const response = await fetch(apiURL + '/historical-sector-price', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData),
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getHistoricalSector'
      setCache('technology', output, 'getHistoricalSector');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getTechnologySector: await getTechnologySector(),
    getHistoricalSector: await getHistoricalSector(),
  };
};