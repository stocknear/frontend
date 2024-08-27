import { getCache, setCache } from '$lib/store';



export const load = async ({parent}) => {
  const getEconomicData = async () => {
    let output;
    const {apiKey, apiURL} = await parent();

    const cachedData = getCache('', 'getEconomicData');
    if (cachedData) {
      output = cachedData;
    } else {
    const response = await fetch(apiURL + '/economic-data', {
      method: 'GET',
      headers: {
        "Content-Type": "application/json", "X-API-KEY": apiKey
      },
    });

    output = await response.json();


    setCache('', output, 'getEconomicData');

    }

    return output;
  };

  // Make sure to return a promise
  return {
    getEconomicData: await getEconomicData()
  };
};