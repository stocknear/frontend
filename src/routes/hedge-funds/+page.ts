import { getCache, setCache } from '$lib/store';



export const load = async () => {
    const getHedgeFunds = async () => {
      let output;
  
      // Get cached data for the specific tickerID
      const cachedData = getCache('getHedgeFunds', 'getHedgeFunds');
      if (cachedData) {
        output = cachedData;
      } else {
        
        output = (await import('$lib/hedge-funds/all-hedge-funds.json'))?.default;
        
        // Cache the data for this specific tickerID with a specific name 'getHedgeFunds'
        setCache('getHedgeFunds', output, 'getHedgeFunds');
      }

  
    
  
      return output;
    };
  
    // Make sure to return a promise
    return {
      getHedgeFunds: await getHedgeFunds()
    };
  };
  