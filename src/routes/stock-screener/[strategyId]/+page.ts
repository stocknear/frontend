import { userRegion, getCache, setCache } from '$lib/store';


const usRegion = ['cle1','iad1','pdx1','sfo1'];

let apiURL;
let fastifyURL;
userRegion.subscribe(value => {

    if (usRegion.includes(value)) {
        apiURL = import.meta.env.VITE_USEAST_API_URL;
        fastifyURL = import.meta.env.VITE_USEAST_FASTIFY_URL;
    } else {
        apiURL = import.meta.env.VITE_EU_API_URL;
        fastifyURL = import.meta.env.VITE_EU_FASTIFY_URL;
    }
});





export const load = async ({params}) => {

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
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(postData)
          });
    
        output = (await response.json())?.items;

        return output;
      };
    

      
  const getStockScreenerData = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getStockScreenerData');
    if (cachedData) {
      output = cachedData;
    } else {

      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/stock-screener-data', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getStockScreenerData'
      setCache('', output, 'getStockScreenerData');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getStockScreenerData: await getStockScreenerData(),
    getStrategy: await getStrategy(),
    getStrategyId: await getStrategyId()
  };
};