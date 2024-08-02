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

const fetchCommunitySentiment = async (pb, ticker, cookies) => {
  const cookieVote = cookies.get(`community-sentiment-${ticker}`);
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0];

  const output = await pb.collection("sentiment").getFullList({
    filter: `ticker="${ticker}" && created >= "${today}" && created < "${tomorrow}"`
  });

  return {
    alreadyVoted: cookieVote || null,
    sentimentData: output[0] || {}
  };
};

export const load = async ({ params, locals, cookies, setHeaders }) => {
  const { apiURL, fastifyURL, apiKey, pb, user } = locals;
  const { tickerID } = params;

  const endpoints = [
    '/similar-stocks', '/stockdeck', '/analyst-summary-rating', '/stock-quote',
    '/bull-bear-say', '/wiim', '/top-etf-ticker-holder', '/one-day-price'
  ];

  const promises = [
    ...endpoints.map(endpoint => fetchData(apiURL, apiKey, endpoint, tickerID)),
    fetchFromFastify(fastifyURL, '/all-watchlists', user?.id),
    //fetchFromFastify(fastifyURL, '/get-portfolio-data', user?.id),
    fetchCommunitySentiment(pb, tickerID, cookies)
  ];

  const [
    getSimilarStock, getStockDeck, getAnalystRating, getStockQuote,
    getBullBearSay, getWhyPriceMoved, getTopETFHolder, getOneDayPrice,
    getUserWatchlist, getUserPortfolio, getCommunitySentiment
  ] = await Promise.all(promises);

  setHeaders({ 'cache-control': 'public, max-age=300' });

  return {
    getSimilarStock,
    getStockDeck,
    getAnalystRating,
    getStockQuote,
    getBullBearSay,
    getWhyPriceMoved,
    getTopETFHolder,
    getOneDayPrice,
    getUserWatchlist,
    getUserPortfolio,
    getCommunitySentiment,
    companyName: cleanString(getStockDeck?.[0]?.companyName),
  };
};