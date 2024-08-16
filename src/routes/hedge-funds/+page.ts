import { getCache, setCache } from '$lib/store';



export const load = async ({parent}) => {
    
  const getAllHedgeFunds = async () => {
    const cachedData = getCache('', 'getAllHedgeFunds');

    if (cachedData) {
      return cachedData;
    }

    const { apiURL, apiKey } = await parent();
    const response = await fetch(apiURL+'/all-hedge-funds', {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey
      },
    });

    const output = await response.json();

    
    setCache('', output, 'getAllHedgeFunds');
    return output;
  };

  
    // Make sure to return a promise
    return {
      getAllHedgeFunds: await getAllHedgeFunds()
    };
  };
  