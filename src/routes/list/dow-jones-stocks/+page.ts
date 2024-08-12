import { getCache, setCache } from '$lib/store';



export const load = async ({parent}) => {
  const getDowJonesConstituentStocks = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getDowJonesConstituentStocks');
    if (cachedData) {
      output = cachedData;
    } else {
      
      const {apiKey, apiURL} = await parent();
      
      const postData = {'filterList': 'dowjonesConstituent'}

      const response = await fetch(apiURL + '/exchange-constituents', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData),
      });

      output = await response.json();

      setCache('', output, 'getDowJonesConstituentStocks');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getDowJonesConstituentStocks: await getDowJonesConstituentStocks()
  };
};