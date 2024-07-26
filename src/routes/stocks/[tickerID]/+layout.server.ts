
const usRegion = ['cle1','iad1','pdx1','sfo1'];

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
    const pattern = new RegExp(`\\b(${substringsToRemove?.join('|')})\\b|,`, 'gi');
  
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

  const output = await response?.json();

  if(endpoint === '/stockdeck')
    {
      companyName = cleanString(output?.at(0)?.companyName);
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


    const output = (await response?.json())?.items;
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

    const output = (await response?.json())?.items;
    
    return output
}

async function fetchCommunitySentiment(pb, ticker, cookies)
{
  let alreadyVoted;
  const cookieVote = cookies?.get('community-sentiment-'+ticker);

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const startDate = today.toISOString().split('T')[0];
  const endDate = tomorrow.toISOString().split('T')[0];

  const output = await pb.collection("sentiment").getFullList({
    filter: `ticker="${ticker}" && created >= "${startDate}" && created < "${endDate}"`
  });

  if (cookieVote) {
    alreadyVoted = cookieVote;
  }

  if(output?.length !== 0) {
    
    return {'alreadyVoted': alreadyVoted, 'sentimentData': output?.at(0)}
  }
  else {
    return {'alreadyVoted': alreadyVoted, 'sentimentData': {} }
  }

}

export const load = async ({ params, locals, cookies, setHeaders}) => {
  
  const userRegion = locals?.region?.split("::")[0];

    let apiURL = locals?.apiURL;
    let fastifyURL = locals?.fastifyURL;
    let apiKey = locals?.apiKey;
    let wsURL;
    
    if (usRegion?.includes(userRegion)) {
        wsURL = import.meta.env.VITE_USEAST_WS_URL;
    } else {
        wsURL = import.meta.env.VITE_EU_WS_URL;
    };
  
    
    

    const promises = [
    fetchData(apiURL,apiKey, '/similar-stocks',params.tickerID),
    fetchData(apiURL,apiKey, '/stockdeck',params.tickerID),
    fetchData(apiURL,apiKey, '/stock-correlation',params.tickerID),
    fetchData(apiURL,apiKey, '/analyst-summary-rating',params.tickerID),
    fetchData(apiURL,apiKey, '/stock-quote',params.tickerID),
    fetchData(apiURL,apiKey, '/bull-bear-say',params.tickerID),
    fetchData(apiURL,apiKey, '/wiim',params.tickerID),
    fetchData(apiURL,apiKey, '/top-etf-ticker-holder',params.tickerID),
    fetchData(apiURL,apiKey, '/one-day-price',params.tickerID),
    fetchWatchlist(fastifyURL, locals?.user?.id),
    fetchPortfolio(fastifyURL, locals?.user?.id),
    fetchCommunitySentiment(locals?.pb, params.tickerID, cookies)
  ];

  const [
    getSimilarStock,
    getStockDeck,
    getCorrelation,
    getAnalystRating,
    getStockQuote,
    getBullBearSay,
    getWhyPriceMoved,
    getTopETFHolder,
    getOneDayPrice,
    getUserWatchlist,
    getUserPortfolio,
    getCommunitySentiment,
  ] = await Promise.all(promises);


  setHeaders({
    'cache-control': 'public, max-age=300' //Cache data for 5 min
    });
    

  return {
    getSimilarStock,
    getStockDeck,
    getCorrelation,
    getAnalystRating,
    getStockQuote,
    getBullBearSay,
    getWhyPriceMoved,
    getTopETFHolder,
    getOneDayPrice,
    getUserWatchlist,
    getUserPortfolio,
    getCommunitySentiment,
    companyName,
    wsURL,
  };

  
};
