import mockData from '../../../fixtures/mock/xom.json';

const MOCK_ENABLED = import.meta.env.VITE_MOCK_DATA === 'true';

export function isMockMode() {
  return MOCK_ENABLED;
}

export function getMockFinancialStatement(ticker: string, statement: string) {
  const data = (mockData as Record<string, any>)[statement];
  return data ?? { annual: [], quarter: [], ttm: [] };
}

export function getMockBulkData(ticker: string) {
  return {
    '/stockdeck': {
      companyName: 'Exxon Mobil Corporation',
      symbol: ticker,
      exchangeShortName: 'NYSE',
      sector: 'Energy',
      industry: 'Oil & Gas Integrated',
      marketCap: 460000000000,
      country: 'US',
      image: '',
    },
    '/stock-quote': {
      price: 105.42,
      changesPercentage: 0.35,
      change: 0.37,
      previousClose: 105.05,
      open: 105.10,
      dayHigh: 106.00,
      dayLow: 104.80,
      volume: 15000000,
      avgVolume: 18000000,
      marketCap: 460000000000,
    },
    '/analyst-summary-rating': {},
    '/pre-post-quote': {},
    '/wiim': {},
    '/one-day-price': [],
    '/next-earnings': {},
    '/earnings-surprise': {},
    '/stock-news': [],
  };
}
