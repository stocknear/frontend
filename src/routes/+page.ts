import { showCookieConsent, userRegion, getCache, setCache } from '$lib/store';


const usRegion = ['cle1','iad1','pdx1','sfo1'];

let apiURL;

userRegion.subscribe(value => {

  if (usRegion.includes(value)) {
    apiURL = import.meta.env.VITE_USEAST_API_URL;
  } else {
    apiURL = import.meta.env.VITE_EU_API_URL;
  }
});


export const load = async () => {


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
          'Content-Type': 'application/json',
        },
      });

      output = await response.json();

      setCache('', output, 'getDailyGainerLoserActive');
    }

    return output;
  };

  const getRssFeedWIIM = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getRssFeedWIIM');
    if (cachedData) {
      output = cachedData;
    } else {

      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/rss-feed-wiim', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      output = await response.json();

      setCache('', output, 'getRssFeedWIIM');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getDailyGainerLoserActive: await getDailyGainerLoserActive(),
    getRssFeedWIIM: await getRssFeedWIIM(),
  };
};