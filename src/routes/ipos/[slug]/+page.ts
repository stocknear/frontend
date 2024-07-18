import { userRegion, getCache, setCache } from '$lib/store';


const usRegion = ['cle1','iad1','pdx1','sfo1'];

let apiURL;
let apiKey = import.meta.env.VITE_STOCKNEAR_API_KEY;


userRegion.subscribe(value => {

  if (usRegion?.includes(value)) {
    apiURL = import.meta.env.VITE_USEAST_API_URL;
  } else {
    apiURL = import.meta.env.VITE_EU_API_URL;
  }
});



export const load = async ({params}) => {
  const getIPOCalendar = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache(params.slug, 'getIPOCalendar');
    if (cachedData) {
      output = cachedData;
    } else {

      // make the POST request to the endpoint
      const postData = {'year': params.slug};

      const response = await fetch(apiURL + '/ipo-calendar', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData),
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getIPOCalendar'
      setCache(params.slug, output, 'getIPOCalendar');
    }

    return output;
  };

  const getYear = async() => {
    return params.slug;
  }

  // Make sure to return a promise
  return {
    getIPOCalendar: await getIPOCalendar(),
    getYear: await getYear(),
  };
};