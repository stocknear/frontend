import { getCache, setCache } from '$lib/store';



export const load = async ({parent}) => {
  const getTopAnalystStocks = async () => {
    let output;
    const { apiURL, apiKey, user} = await parent();

    const cachedData = getCache('', 'getTopAnalystStocks');
    if (cachedData) {
      output = cachedData;
    } else {

      const response = await fetch(apiURL + '/top-analysts-stocks', {
      method: 'GET',
      headers: {
        "Content-Type": "application/json", "X-API-KEY": apiKey
      },
    });

    output = await response.json();

    setCache('', output, 'getTopAnalystStocksg');

    }

    output = user?.tier !== 'Pro' ? output?.reverse()?.slice(0,6) : output;
    return output;
  };

  // Make sure to return a promise
  return {
    getTopAnalystStocks: await getTopAnalystStocks()
  };
};