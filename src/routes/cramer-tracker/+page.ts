import { userRegion, getCache, setCache } from '$lib/store';


const usRegion = ['cle1','iad1','pdx1','sfo1'];

let apiURL;
let apiKey = import.meta.env.VITE_STOCKNEAR_API_KEY;


userRegion.subscribe(value => {

  if (usRegion.includes(value)) {
    apiURL = import.meta.env.VITE_USEAST_API_URL;
  } else {
    apiURL = import.meta.env.VITE_EU_API_URL;
  }
});


export const load = async ({parent}) => {

  const getCramerTracker = async () => {
    let output;
    const data = await parent();

    const cachedData = getCache('', 'getCramerTracker');
    if (cachedData) {
      output = cachedData;
    } else {
    // make the POST request to the endpoint
    const response = await fetch(apiURL + '/cramer-tracker', {
      method: 'GET',
      headers: {
        "Content-Type": "application/json", "X-API-KEY": apiKey
      },
    });

    output = await response.json();

    setCache('', output, 'getCramerTracker');

    }

    output = data?.user?.tier !== 'Pro' ? output?.slice(0,6) : output;

    console.log(output)


    return output;
  };

  // Make sure to return a promise
  return {
    getCramerTracker: await getCramerTracker()
  };
};