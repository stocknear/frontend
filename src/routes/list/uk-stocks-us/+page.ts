import { getCache, setCache } from '$lib/store';



export const load = async ({parent}) => {
  const getUKStocksUS = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getUKStocksUS');
    if (cachedData) {
      output = cachedData;
    } else {
      
      const{ apiURL, apiKey} = await parent();
      
      const postData = {'filterList': 'UK'}

      const response = await fetch(apiURL + '/filter-stock-list', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData),
      });

      output = await response.json();

      setCache('', output, 'getUKStocksUS');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getUKStocksUS: await getUKStocksUS()
  };
};