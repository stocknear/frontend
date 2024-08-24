import { getCache, setCache } from '$lib/store';


export const load = async ({parent}) => {
  const getCommunicationServicesSector = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getCommunicationServicesSector');
    if (cachedData) {
      output = cachedData;
    } else {
      const {apiKey, apiURL} = await parent();
      
      const postData = {'filterList': 'communication-services'};
      
      const response = await fetch(apiURL + '/filter-stock-list', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData),
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getCommunicationServicesSector'
      setCache('', output, 'getCommunicationServicesSector');
    }

    return output;
  };

  const getHistoricalSector = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('communication-services', 'getHistoricalSector');
    if (cachedData) {
      output = cachedData;
    } else {
      
      const {apiKey, apiURL} = await parent();
      
      const postData = {'filterList': 'communication-services'}

      const response = await fetch(apiURL + '/historical-sector-price', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData),
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getHistoricalSector'
      setCache('communication-services', output, 'getHistoricalSector');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getCommunicationServicesSector: await getCommunicationServicesSector(),
    getHistoricalSector: await getHistoricalSector(),
  };
};