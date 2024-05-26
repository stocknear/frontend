import { getCache, setCache } from '$lib/store';


export const load = async ({ params }) => {
    const getAllHedgeFunds = async () => {
      let output;
  
      // Get cached data for the specific tickerID
      const cachedData = getCache('getAllHedgeFunds', 'getAllHedgeFunds');
      if (cachedData) {
        output = cachedData;
      } else {
        
        output = await import('$lib/hedge-funds/all-hedge-funds.json')
  
        // Cache the data for this specific tickerID with a specific name 'getAllHedgeFunds'
        setCache('getAllHedgeFunds', output, 'getAllHedgeFunds');
      }
      
  
      return output.default;
    };
  
    // Make sure to return a promise
    return {
      getAllHedgeFunds: await getAllHedgeFunds()
    };
  };
  