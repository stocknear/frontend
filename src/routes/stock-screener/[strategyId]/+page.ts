import { getCache, setCache } from '$lib/store';




export const load = async ({parent, params}) => {


  const { apiURL, apiKey, fastifyURL} = await parent();

    const getStrategyId = async () => {
        return params.strategyId;
      };

    const getStrategy = async () => {
        let output;
    
        // make the POST request to the endpoint
        const postData = {'strategyId': params.strategyId}
        const response = await fetch(fastifyURL+'/get-strategy', {
          method: 'POST',
          headers: {
             "Content-Type": "application/json"
          },
          body: JSON.stringify(postData)
          });
    
        output = (await response.json())?.items;

        return output;
      };
    

      
  const getStockScreenerData = async () => {
    let output;
    const strategy = await getStrategy();
    const ruleOfList = strategy?.rules?.map(item => item?.name) || [];
    const ruleNames = ruleOfList.sort().join(',');
    // Get cached data for the specific tickerID
    const cachedData = getCache(ruleNames, 'getStockScreenerData');
    if (cachedData) {
      output = cachedData;
    } else {
          
      const postData = {'ruleOfList': ruleOfList} 
      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/stock-screener-data', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData)
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getStockScreenerData'
      setCache(ruleNames, output, 'getStockScreenerData');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getStockScreenerData: await getStockScreenerData(),
    getStrategy: await getStrategy(),
    getStrategyId: await getStrategyId(),
  };
};