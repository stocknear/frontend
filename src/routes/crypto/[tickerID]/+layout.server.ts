

let companyName;

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

  if(endpoint === '/crypto-profile')
    {
      companyName = output?.name;
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

    const promises = [
    fetchData(apiURL,apiKey,'/crypto-profile',params.tickerID),
    fetchData(apiURL,apiKey,'/stock-quote',params.tickerID),
    fetchData(apiURL,apiKey,'/one-day-price',params.tickerID),
    fetchWatchlist(fastifyURL, locals?.user?.id),
    fetchPortfolio(fastifyURL, locals?.user?.id)
  ];

  const [
    getCryptoProfile,
    getStockQuote,
    getOneDayPrice,
    getUserWatchlist,
    getUserPortfolio,
  ] = await Promise.all(promises);


  setHeaders({
    'cache-control': 'public, max-age=300'
    });
    

  return {
    getCryptoProfile,
    getStockQuote,
    getOneDayPrice,
    getUserWatchlist,
    getUserPortfolio,
    companyName,
  };

  
};
