import { getCache, setCache } from '$lib/store';

export const load = async ({parent}) => {
  const getMarketNews = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getMarketNews');
    if (cachedData) {
      output = cachedData;
    } else {
      const { apiURL, apiKey } = await parent();
      const postData = {'newsType': 'stock-news'}
      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/market-news', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData)
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getMarketNews'
      setCache('', output, 'getMarketNews');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getMarketNews: await getMarketNews()
  };
};