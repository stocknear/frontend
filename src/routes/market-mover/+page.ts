import { getCache, setCache } from '$lib/store';



export const load = async ({parent}) => {

  const { apiURL, apiKey} = await parent();

  
  const getDailyGainerLoserActive = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getDailyGainerLoserActive');
    if (cachedData) {
      output = cachedData;
    } else {

      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/market-movers', {
        method: 'GET',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
      });

      output = await response.json();

      setCache('', output, 'getDailyGainerLoserActive');
    }

    return output;
  };

  const getMiniPlotsIndex = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getMiniPlotsIndex');
    if (cachedData) {
      output = cachedData;
    } else {

      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/mini-plots-index', {
        method: 'GET',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
      });

      output = await response.json();

      setCache('', output, 'getMiniPlotsIndex');
    }

    return output;
  };



  // Make sure to return a promise
  return {
    getDailyGainerLoserActive: await getDailyGainerLoserActive(),
    getMiniPlotsIndex: await getMiniPlotsIndex(),
  };
};