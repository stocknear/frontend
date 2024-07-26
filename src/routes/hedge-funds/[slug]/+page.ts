import { displayCompanyName, getCache, setCache } from '$lib/store';

export const load = async ({ parent, params }) => {
  const getHedgeFundsData = async () => {
    const cachedData = getCache(params.slug, 'getHedgeFundsData');
    if (cachedData) return cachedData;

    const { apiURL, apiKey } = await parent();
    const response = await fetch(apiURL+'/cik-data', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey
      },
      body: JSON.stringify({ cik: params.slug })
    });

    const output = await response.json();

    if (output?.holdings) {
      output.holdings = output?.holdings?.filter(item => item?.sharesNumber && item?.symbol);
    }

    setCache(params.slug, output, 'getHedgeFundsData');
    displayCompanyName.update(() => output?.name ?? params.slug);
    return output;
  };

  return {
    getHedgeFundsData: await getHedgeFundsData()
  };
};