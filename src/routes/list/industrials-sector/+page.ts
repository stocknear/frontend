import { getCache, setCache } from '$lib/store';




export const load = async ({parent}) => {
  const getIndustrialsSector = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getIndustrialsSector');
    if (cachedData) {
      output = cachedData;
    } else {
      
      const {apiKey, apiURL} = await parent();
      
      const postData = {'filterList': 'industrials'}

      const response = await fetch(apiURL + '/filter-stock-list', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData),
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getIndustrialsSector'
      setCache('', output, 'getIndustrialsSector');
    }

    return output;
  };

  const getHistoricalSector = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('industrials', 'getHistoricalSector');
    if (cachedData) {
      output = cachedData;
    } else {
      
      const {apiKey, apiURL} = await parent();
      
      const postData = {'filterList': 'industrials'}

      const response = await fetch(apiURL + '/historical-sector-price', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData),
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getHistoricalSector'
      setCache('industrials', output, 'getHistoricalSector');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getIndustrialsSector: await getIndustrialsSector(),
    getHistoricalSector: await getHistoricalSector(),
  };
};