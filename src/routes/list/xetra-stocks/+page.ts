import {getCache, setCache } from '$lib/store';



export const load = async ({parent}) => {
  const getXetraStocks = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getXetraStocks');
    if (cachedData) {
      output = cachedData;
    } else {
      
      const { apiKey, apiURL} = await parent();
      
      const postData = {'filterList': 'xetra'}

      const response = await fetch(apiURL + '/filter-stock-list', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData),
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getXetraStocks'
      setCache('', output, 'getXetraStocks');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getXetraStocks: await getXetraStocks()
  };
};