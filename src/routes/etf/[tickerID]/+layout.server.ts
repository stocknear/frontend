
const usRegion = ['cle1','iad1','pdx1','sfo1'];

let companyName;
let apiKey = import.meta.env.VITE_STOCKNEAR_API_KEY;


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

const fetchData = async (apiURL, endpoint, ticker) => {

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
    
    const userRegion = locals.region?.split("::")[0];

    let apiURL;

    let fastifyURL;

    if (usRegion?.includes(userRegion)) {
        apiURL = import.meta.env.VITE_USEAST_API_URL;
        fastifyURL = import.meta.env.VITE_USEAST_FASTIFY_URL;
    } else {
        apiURL = import.meta.env.VITE_EU_API_URL;
        fastifyURL = import.meta.env.VITE_EU_FASTIFY_URL;
    };
  
    


const promises = [
    fetchData(apiURL,'/etf-profile', params.tickerID),
    fetchData(apiURL,'/similar-etfs',  params.tickerID),
    fetchData(apiURL,'/etf-country-weighting', params.tickerID),
    fetchData(apiURL,'/stock-correlation', params.tickerID),
    fetchData(apiURL,'/etf-holdings',  params.tickerID),
    fetchData(apiURL,'/stock-dividend',params.tickerID),
    fetchData(apiURL,'/stock-quote',  params.tickerID),
    fetchData(apiURL,'/stock-rating', params.tickerID),
    fetchData(apiURL,'/wiim',params.tickerID),
    fetchData(apiURL,'/one-day-price',params.tickerID),
    fetchWatchlist(fastifyURL, locals?.user?.id),
    fetchPortfolio(fastifyURL, locals?.user?.id)
  ];

  const [
    getETFProfile,
    getSimilarETFs,
    getCountryWeighting,
    getCorrelation,
    getETFHoldings,
    getStockDividend,
    getStockQuote,
    getStockTARating,
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
    getCorrelation,
    getETFHoldings,
    getStockDividend,
    getStockQuote,
    getStockTARating,
    getWhyPriceMoved,
    getOneDayPrice,
    getUserWatchlist,
    getUserPortfolio,
    companyName,
  };

  
};
