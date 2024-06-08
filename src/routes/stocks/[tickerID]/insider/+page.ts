import { userRegion, getCache, setCache } from '$lib/store';

const usRegion = ['cle1','iad1','pdx1','sfo1'];

let apiURL = import.meta.env.VITE_EU_API_URL; // Set a default API URL

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
          'Content-Type': 'application/json',
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

    let sums = {
      totalBought: 0,
      totalSold: 0,
      purchases: 0,
      sales: 0
    };

    const cachedData = getCache(params.tickerID, 'getInsiderTradingStatistics');
      if (cachedData) {
        sums = cachedData;
      } else {
        const postData = {
          ticker: params.tickerID
        };

      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/insider-trading-statistics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      });

      const output = await response?.json();

      // Iterate through the list and accumulate the values
      output?.forEach(item => {
        sums.totalBought += item.totalBought;
        sums.totalSold += item.totalSold;
        sums.purchases += item.purchases;
        sums.sales += item.sales;
      });
      
      setCache(params.tickerID, sums, 'getInsiderTradingStatistics');

    }

    return sums;
  };

  // Make sure to return a promise
  return {
    getInsiderTrading: await getInsiderTrading(),
    getInsiderTradingStatistics: await getInsiderTradingStatistics()
  };
};