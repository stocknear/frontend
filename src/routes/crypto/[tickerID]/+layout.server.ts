
const usRegion = ['cle1','iad1','pdx1','sfo1'];

let companyName;

let apiKey = import.meta.env.VITE_STOCKNEAR_API_KEY;

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
    fetchData(apiURL,'/crypto-profile',params.tickerID),
    fetchData(apiURL,'/stock-quote',params.tickerID),
    fetchData(apiURL,'/stock-rating',params.tickerID),
    fetchData(apiURL,'/one-day-price',params.tickerID),
    fetchWatchlist(fastifyURL, locals?.user?.id),
    fetchPortfolio(fastifyURL, locals?.user?.id)
  ];

  const [
    getCryptoProfile,
    getStockQuote,
    getStockTARating,
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
    getStockTARating,
    getOneDayPrice,
    getUserWatchlist,
    getUserPortfolio,
    companyName,
  };

  
};
