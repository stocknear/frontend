import { getCache, setCache } from '$lib/store';



export const load = async ({parent}) => {
  const getEconomicIndicator = async () => {
    let output;
    const {apiKey, apiURL} = await parent();

    const cachedData = getCache('', 'getEconomicIndicator');
    if (cachedData) {
      output = cachedData;
    } else {
    const response = await fetch(apiURL + '/economic-indicator', {
      method: 'GET',
      headers: {
        "Content-Type": "application/json", "X-API-KEY": apiKey
      },
    });

    output = await response.json();


    setCache('', output, 'getEconomicIndicator');

    }

    return output;
  };

  // Make sure to return a promise
  return {
    getEconomicIndicator: await getEconomicIndicator()
  };
};