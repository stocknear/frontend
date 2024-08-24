import { getCache, setCache } from '$lib/store';


export const load = async ({parent}) => {
  const getRealEstateSector = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getRealEstateSector');
    if (cachedData) {
      output = cachedData;
    } else {
      
      const {apiKey, apiURL} = await parent();
      
      const postData = {'filterList': 'real-estate'}
      const response = await fetch(apiURL + '/filter-stock-list', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData),
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getRealEstateSector'
      setCache('', output, 'getRealEstateSector');
    }

    return output;
  };

  const getHistoricalSector = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('real-estate', 'getHistoricalSector');
    if (cachedData) {
      output = cachedData;
    } else {
      
      const {apiKey, apiURL} = await parent();
      
      const postData = {'filterList': 'real-estate'}

      const response = await fetch(apiURL + '/historical-sector-price', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData),
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getHistoricalSector'
      setCache('real-estate', output, 'getHistoricalSector');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getRealEstateSector: await getRealEstateSector(),
    getHistoricalSector: await getHistoricalSector(),
  };
};