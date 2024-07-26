let companyName;


function cleanString(input) {
    // Define a list of substrings to remove (case insensitive)
    const substringsToRemove = [
      'Depositary',
      'Inc.',
      'Incorporated',
      'Holdings',
      'Corporation',
      'Corporations',
      'LLC',
      'Holdings plc American Depositary Shares',
      'Holding Corporation',
      'Oyj',
      'Company',
      'The',
      'plc',
    ];
  
    // Create a regular expression pattern that matches any of the substrings surrounded by word boundaries
    const pattern = new RegExp(`\\b(${substringsToRemove.join('|')})\\b|,`, 'gi');
  
    // Use the replace method to remove the specified substrings and commas, then trim the result
    return input?.replace(pattern, '')?.trim();
  }

const fetchData = async (apiURL, apiKey, endpoint, ticker) => {

  const postData = {
    ticker: ticker
  };

  const response = await fetch(apiURL + endpoint, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json", "X-API-KEY": apiKey
    },
    body: JSON.stringify(postData)
  });

  const output = await response.json();


  if(endpoint === '/etf-profile')
    {
      companyName = cleanString(output?.at(0)?.name);
    }
  return output;
};

const fetchWatchlist = async (fastifyURL, userId) => {

    const postData = {'userId': userId}
    const response = await fetch(fastifyURL+'/all-watchlists', {
        method: 'POST',
        headers: {
         "Content-Type": "application/json"
        },
        body: JSON.stringify(postData)
    });


    const output = (await response.json())?.items;
    return output;
}

async function fetchPortfolio(fastifyURL, userId)
{
  const postData = {'userId': userId};

    const response = await fetch(fastifyURL+'/get-portfolio-data', {
      method: 'POST',
      headers: {
       "Content-Type": "application/json"
      },
      body: JSON.stringify(postData)
    });

    const output = (await response.json())?.items;
    
    return output
}

export const load = async ({ params, locals, setHeaders}) => {
    
  let apiURL = locals?.apiURL;
  let fastifyURL = locals?.fastifyURL;
  let apiKey = locals?.apiKey;
  let wsURL = locals?.wsURL;


const promises = [
    fetchData(apiURL,apiKey, '/etf-profile', params.tickerID),
    fetchData(apiURL,apiKey, '/similar-etfs',  params.tickerID),
    fetchData(apiURL,apiKey, '/etf-country-weighting', params.tickerID),
    fetchData(apiURL,apiKey, '/etf-holdings',  params.tickerID),
    fetchData(apiURL,apiKey, '/stock-dividend',params.tickerID),
    fetchData(apiURL,apiKey, '/stock-quote',  params.tickerID),
    fetchData(apiURL,apiKey, '/wiim',params.tickerID),
    fetchData(apiURL,apiKey, '/one-day-price',params.tickerID),
    fetchWatchlist(fastifyURL, locals?.user?.id),
    fetchPortfolio(fastifyURL, locals?.user?.id)
  ];

  const [
    getETFProfile,
    getSimilarETFs,
    getCountryWeighting,
    getETFHoldings,
    getStockDividend,
    getStockQuote,
    getWhyPriceMoved,
    getOneDayPrice,
    getUserWatchlist,
    getUserPortfolio,
  ] = await Promise.all(promises);

  
  setHeaders({
    'cache-control': 'public, max-age=300'
    });
  

  return {
    getETFProfile,
    getSimilarETFs,
    getCountryWeighting,
    getETFHoldings,
    getStockDividend,
    getStockQuote,
    getWhyPriceMoved,
    getOneDayPrice,
    getUserWatchlist,
    getUserPortfolio,
    companyName,
    wsURL,
  };

  
};
