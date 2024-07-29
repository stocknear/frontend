import { getCache, setCache } from '$lib/store';



export const load = async ({parent}) => {
  const getCryptoList = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getCryptoList');
    if (cachedData) {
      output = cachedData;
    } else {

      const {apiKey, apiURL} = await parent();
      const response = await fetch(apiURL + '/all-crypto-tickers', {
        method: 'GET',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
      });

      output = (await response.json())?.sort((a, b) => b?.marketCap - a?.marketCap);

      // Cache the data for this specific tickerID with a specific name 'getCryptoList'
      setCache('', output, 'getCryptoList');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getCryptoList: await getCryptoList()
  };
};