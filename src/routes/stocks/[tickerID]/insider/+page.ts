import { userRegion, getCache, setCache } from '$lib/store';

const usRegion = ['cle1','iad1','pdx1','sfo1'];

let apiURL = import.meta.env.VITE_EU_API_URL; // Set a default API URL
let apiKey = import.meta.env.VITE_STOCKNEAR_API_KEY;

userRegion.subscribe(value => {

  if (usRegion.includes(value)) {
    apiURL = import.meta.env.VITE_USEAST_API_URL;
  } else {
    apiURL = import.meta.env.VITE_EU_API_URL;
  }
});




const transactionTypeMap = {
  'P-Purchase': 'Bought',
  'A-Award': 'Grant',
  'D-Return': 'Grant',
  'G-Gift': 'Grant',
  'S-Sale': 'Sold',
  'M-Exempt': 'Exercise',
  'X-InTheMoney': 'Exercise',
  'C-Conversion': 'Exercise',
  'F-InKind': 'Sold',
  'J-Other': (item) => {
    if (item.acquistionOrDisposition === 'D') {
      return 'Sold';
    } else if (item.acquistionOrDisposition === 'A') {
      return 'Bought';
    } else {
      return 'Other';
    }
  },
  '': 'n/a'
};

export const load = async ({ params }) => {

  const getInsiderTrading = async () => {
    let output;


      const cachedData = getCache(params.tickerID, 'getInsiderTrading');
      if (cachedData) {
        output = cachedData;
      } else {
        const postData = {
          ticker: params.tickerID
        };

      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/insider-trading', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData)
      });

      output = await response.json();

      output = output?.map(item => ({
        ...item,
        transactionType: typeof transactionTypeMap[item?.transactionType] === 'function'
          ? transactionTypeMap[item?.transactionType](item)
          : transactionTypeMap[item?.transactionType] || 'n/a'
      }));
      
      setCache(params.tickerID, output, 'getInsiderTrading');
    
    }

    return output;
  };


  const getInsiderTradingStatistics = async () => {

    let output;

    const cachedData = getCache(params.tickerID, 'getInsiderTradingStatistics');
      if (cachedData) {
        output = cachedData;
      } else {
        const postData = {
          ticker: params.tickerID
        };

      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/insider-trading-statistics', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData)
      });

      output = await response?.json();

      setCache(params.tickerID, output, 'getInsiderTradingStatistics');

    }

    return output;
  };


async function historicalPrice() {
    let output;

    const cachedData = getCache(params.tickerID, 'historicalPrice'+'insider');
      if (cachedData) {
        output = cachedData;
    } else {
        const postData = {
          ticker: params.tickerID,
          timePeriod: 'max',
        };
  
        const response = await fetch(apiURL+'/historical-price', {
          method: 'POST',
          headers: {
            "Content-Type": "application/json", "X-API-KEY": apiKey
          },
          body: JSON.stringify(postData)
        });
  
        output = await response?.json() ?? [];

        //Adding this would create a bug hence I cant use the historicalPrice endpoint such as in +page.svelte but rather need to call
        // it again without modification.
      /*
        output= (data) => data?.map(({ time, open, high, low, close }) => ({ 
            time: Date.parse(time), 
            open, 
            high, 
            low, 
            close 
        }));
        */
        
  
        setCache(params.tickerID, output, 'historicalPrice'+'insider');
      
    }

    return output; 
    
  }

  

  // Make sure to return a promise
  return {
    getInsiderTrading: await getInsiderTrading(),
    getInsiderTradingStatistics: await getInsiderTradingStatistics(),
    getHistoricalPrice: await historicalPrice()
  };
};