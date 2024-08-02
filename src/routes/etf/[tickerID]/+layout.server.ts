const cleanString = (input) => {
  const substringsToRemove = [
    'Depositary', 'Inc.', 'Incorporated', 'Holdings', 'Corporation', 'Corporations',
    'LLC', 'Holdings plc American Depositary Shares', 'Holding Corporation', 'Oyj',
    'Company', 'The', 'plc',
  ];
  const pattern = new RegExp(`\\b(${substringsToRemove.join('|')})\\b|,`, 'gi');
  return input?.replace(pattern, '').trim();
};

const fetchData = async (apiURL, apiKey, endpoint, ticker) => {
  const response = await fetch(`${apiURL}${endpoint}`, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey
    },
    body: JSON.stringify({ ticker })
  });
  return response.json();
};

const fetchFromFastify = async (fastifyURL, endpoint, userId) => {
  const response = await fetch(`${fastifyURL}${endpoint}`, {
    method: 'POST',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });
  const { items } = await response.json();
  return items;
};

export const load = async ({ params, locals, setHeaders }) => {
  const { apiURL, fastifyURL, apiKey, user } = locals;
  const { tickerID } = params;

  const endpoints = [
    '/etf-profile', '/similar-etfs', '/etf-country-weighting', '/etf-holdings',
    '/stock-dividend', '/stock-quote', '/wiim', '/one-day-price'
  ];

  const promises = [
    ...endpoints.map(endpoint => fetchData(apiURL, apiKey, endpoint, tickerID)),
    fetchFromFastify(fastifyURL, '/all-watchlists', user?.id),
    //fetchFromFastify(fastifyURL, '/get-portfolio-data', user?.id)
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
  ] = await Promise.all(promises);

  setHeaders({ 'cache-control': 'public, max-age=300' });

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
    companyName: cleanString(getETFProfile?.[0]?.name),
  };
};