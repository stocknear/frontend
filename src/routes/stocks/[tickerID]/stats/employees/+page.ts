import { getCache, setCache } from '$lib/store';


export const load = async ({ parent, params }) => {
  const getHistoryEmployee = async () => {
    let output;
    // Get cached data for the specific tickerID
    const cachedData = getCache(params.tickerID, 'getHistoryEmployee');
    if (cachedData) {
      output = cachedData;
    } else {
      
      const data = await parent();
      const postData = {
        ticker: params.tickerID
      };

      // make the POST request to the endpoint
      const response = await fetch(data?.apiURL + '/history-employees', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": data?.apiKey
        },
        body: JSON.stringify(postData)
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getHistoryEmployee'
      setCache(params.tickerID, output, 'getHistoryEmployee');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getHistoryEmployee: await getHistoryEmployee()
  };
};
