import { userRegion, getCache, setCache } from '$lib/store';


const usRegion = ['cle1','iad1','pdx1','sfo1'];

let apiURL;

userRegion.subscribe(value => {

  if (usRegion.includes(value)) {
    apiURL = import.meta.env.VITE_USEAST_API_URL;
  } else {
    apiURL = import.meta.env.VITE_EU_API_URL;
  }
});


export const load = async ({parent}) => {
  const getFDACalendar = async () => {
    let output;
    const data = await parent();

    const cachedData = getCache('', 'getFDACalendar');
    if (cachedData) {
      output = cachedData;
    } else {
    // make the POST request to the endpoint
    const response = await fetch(apiURL + '/fda-calendar', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    output = await response.json();

    output = data?.user?.tier !== 'Pro' ? output?.slice(0,6) : output;

    setCache('', output, 'getFDACalendar');

    }

    return output;
  };

  // Make sure to return a promise
  return {
    getFDACalendar: await getFDACalendar()
  };
};