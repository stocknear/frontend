
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

const fetchData = async (apiURL, endpoint, ticker) => {

  const postData = {
    ticker: ticker
  };

  const response = await fetch(apiURL + endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
        'Content-Type': 'application/json'
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
      'Content-Type': 'application/json'
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

export const load = async ({ params, locals, cookies}) => {

 
    const userRegion = locals?.region?.split("::")[0];

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
    fetchData(apiURL,'/fair-price',params.tickerID),
    fetchData(apiURL,'/similar-stocks',params.tickerID),
    //fetchData(apiURL,'/price-prediction',params.tickerID),
    //fetchData(apiURL,'/trading-signals',params.tickerID),
    fetchData(apiURL,'/stockdeck',params.tickerID),
    fetchData(apiURL,'/stock-correlation',params.tickerID),
    fetchData(apiURL,'/analyst-summary-rating',params.tickerID),
    fetchData(apiURL,'/stock-quote',params.tickerID),
    fetchData(apiURL,'/stock-rating',params.tickerID),
    fetchData(apiURL,'/options-bubble',params.tickerID),
    fetchData(apiURL,'/bull-bear-say',params.tickerID),
    fetchData(apiURL,'/wiim',params.tickerID),
    fetchData(apiURL,'/top-etf-ticker-holder',params.tickerID),
    fetchData(apiURL,'/sentiment-analysis',params.tickerID),
    fetchData(apiURL,'/fundamental-predictor-analysis',params.tickerID),
    fetchData(apiURL,'/value-at-risk',params.tickerID),
    fetchData(apiURL,'/historical-price',params.tickerID),
    fetchData(apiURL,'/one-day-price',params.tickerID),
    fetchWatchlist(fastifyURL, locals?.user?.id),
    fetchPortfolio(fastifyURL, locals?.user?.id),
    fetchCommunitySentiment(locals?.pb, params.tickerID, cookies)
  ];

  const [
    getFairPrice,
    getSimilarStock,
    //getPricePrediction,
    //getTradingSignals,
    getStockDeck,
    getCorrelation,
    getAnalystRating,
    getStockQuote,
    getStockTARating,
    getOptionsData,
    getBullBearSay,
    getWhyPriceMoved,
    getTopETFHolder,
    getSentimentAnalysis,
    getFundamentalAnalysis,
    getVaR,
    getHistoricalPrice,
    getOneDayPrice,
    getUserWatchlist,
    getUserPortfolio,
    getCommunitySentiment,
  ] = await Promise.all(promises);

  /*
  setHeaders({
    'cache-control': 'public, max-age=500'
    });
    */

  return {
    getFairPrice,
    getSimilarStock,
    //getPricePrediction,
    //getTradingSignals,
    getStockDeck,
    getCorrelation,
    getAnalystRating,
    getStockQuote,
    getStockTARating,
    getOptionsData,
    getBullBearSay,
    getWhyPriceMoved,
    getTopETFHolder,
    getSentimentAnalysis,
    getFundamentalAnalysis,
    getVaR,
    getHistoricalPrice,
    getOneDayPrice,
    getUserWatchlist,
    getUserPortfolio,
    getCommunitySentiment,
    companyName,
  };

  
};
