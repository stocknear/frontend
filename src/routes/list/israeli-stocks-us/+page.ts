import { getCache, setCache } from '$lib/store';




export const load = async ({parent}) => {
  const getIsraeliStocksUS = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getIsraeliStocksUS');
    if (cachedData) {
      output = cachedData;
    } else {
      
      const{ apiURL, apiKey} = await parent();
      
      const postData = {'filterList': 'IL'}

      const response = await fetch(apiURL + '/filter-stock-list', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData),
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getIsraeliStocksUS'
      setCache('', output, 'getIsraeliStocksUS');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getIsraeliStocksUS: await getIsraeliStocksUS()
  };
};