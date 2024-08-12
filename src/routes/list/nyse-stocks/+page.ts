import { getCache, setCache } from '$lib/store';




export const load = async ({parent}) => {
  const getNyseStocks = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getNyseStocks');
    if (cachedData) {
      output = cachedData;
    } else {
      
      const { apiURL, apiKey} = await parent();
      
      const postData = {'filterList': 'nyse'}

      const response = await fetch(apiURL + '/filter-stock-list', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData),
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getNyseStocks'
      setCache('', output, 'getNyseStocks');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getNyseStocks: await getNyseStocks()
  };
};