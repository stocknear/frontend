import { getCache, setCache } from '$lib/store';


export const load = async ({ params }) => {
    const getWorstHedgeFunds = async () => {
      let output;
  
      // Get cached data for the specific tickerID
      const cachedData = getCache('getWorstHedgeFunds', 'getWorstHedgeFunds');
      if (cachedData) {
        output = cachedData;
      } else {
        
        output = await import('$lib/hedge-funds/worst-hedge-funds.json')
  
        // Cache the data for this specific tickerID with a specific name 'getWorstHedgeFunds'
        setCache('getWorstHedgeFunds', output, 'getWorstHedgeFunds');
      }
      
  
      return output.default;
    };
  
    // Make sure to return a promise
    return {
      getWorstHedgeFunds: await getWorstHedgeFunds()
    };
  };
  