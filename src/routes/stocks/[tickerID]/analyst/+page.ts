import { getCache, setCache } from '$lib/store';


export const load = async ({ parent, params }) => {

  const getAnalystTickerHistory = async () => {
    
    let output;

    const cachedData = getCache(params.tickerID, 'getAnalystTickerHistory');
      if (cachedData) {
        output = cachedData;
      } else {

        const data = await parent();
        const postData = {
          ticker: params.tickerID
        };

      // make the POST request to the endpoint
      const response = await fetch(data?.apiURL + '/analyst-ticker-history', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": data?.apiKey
        },
        body: JSON.stringify(postData)
      });

    output = await response.json();

    setCache(params.tickerID, output, 'getAnalystTickerHistory');
    
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getAnalystTickerHistory: await getAnalystTickerHistory()
  };
};
