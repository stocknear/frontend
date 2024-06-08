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



export const load = async ( { parent  } ) => {

  const getTopAnalyst = async () => {
    const data = await parent()
    let output;

    const cachedData = getCache('', 'getTopAnalyst');
    if (cachedData) {
      output = cachedData;
    } else {

      const response = await fetch(apiURL + '/top-analysts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      output = await response?.json();
       setCache('', output, 'getTopAnalyst');
    }
    
    output = data?.user?.tier !== 'Pro' ? output?.reverse()?.slice(0,6) : output;

    return output;
  };

  // Make sure to return a promise
  return {
    getTopAnalyst: await getTopAnalyst()
  };
};