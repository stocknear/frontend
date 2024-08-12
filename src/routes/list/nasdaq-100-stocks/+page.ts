import { getCache, setCache } from '$lib/store';


export const load = async ({parent}) => {
  const getNasdaqConstituentsStocks = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getNasdaqConstituentsStocks');
    if (cachedData) {
      output = cachedData;
    } else {
      
      const {apiURL, apiKey} = await parent();
      
      const postData = {'filterList': 'nasdaqConstituent'}

      const response = await fetch(apiURL + '/exchange-constituents', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData),
      });

      output = await response.json();

      setCache('', output, 'getNasdaqConstituentsStocks');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getNasdaqConstituentsStocks: await getNasdaqConstituentsStocks()
  };
};