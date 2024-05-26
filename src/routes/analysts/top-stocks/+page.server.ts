import { userRegion, getCache, setCache } from '$lib/store';
const usRegion = ['cle1','iad1','pdx1','sfo1'];



let apiURL;

userRegion.subscribe(value => {

  if (usRegion?.includes(value)) {
    apiURL = import.meta.env.VITE_USEAST_API_URL;
  } else {
    apiURL = import.meta.env.VITE_EU_API_URL;
  }
});



export const load = async ({locals}) => {
  const getTopAnalystStocks = async () => {
    let apiURL;

    if (usRegion?.includes(userRegion)) {
        apiURL = import.meta.env.VITE_USEAST_API_URL;
    } else {
        apiURL = import.meta.env.VITE_EU_API_URL;
    };

    // make the POST request to the endpoint
    const response = await fetch(apiURL + '/top-analysts-stocks', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    let output = await response.json();

    output = locals?.user?.tier !== 'Pro' ? output?.reverse()?.slice(0,6) : output;

    return output;
  };

  // Make sure to return a promise
  return {
    getTopAnalystStocks: await getTopAnalystStocks()
  };
};