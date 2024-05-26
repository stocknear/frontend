const usRegion = ['cle1','iad1','pdx1','sfo1'];




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

export const load = async ({ params, locals }) => {

  const userRegion = locals.region?.split("::")[0];

    let apiURL;

    if (usRegion?.includes(userRegion)) {
        apiURL = import.meta.env.VITE_USEAST_API_URL;
    } else {
        apiURL = import.meta.env.VITE_EU_API_URL;
    };


  const getInsiderTrading = async () => {
    let output;

    // Get cached data for the specific tickerID
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
  

    return output;
  };


  const getInsiderTradingStatistics = async () => {

    // Get cached data for the specific tickerID
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

      const output = await response.json();

      // Initialize a new object to store the sums
      let sums = {
        totalBought: 0,
        totalSold: 0,
        purchases: 0,
        sales: 0
      };

      // Iterate through the list and accumulate the values
      output?.forEach(item => {
        sums.totalBought += item.totalBought;
        sums.totalSold += item.totalSold;
        sums.purchases += item.purchases;
        sums.sales += item.sales;
      });

      console.log(sums)
        

    return sums;
  };

  // Make sure to return a promise
  return {
    getInsiderTrading: await getInsiderTrading(),
    getInsiderTradingStatistics: await getInsiderTradingStatistics()
  };
};