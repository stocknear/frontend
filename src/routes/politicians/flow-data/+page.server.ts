const usRegion = ['cle1','iad1','pdx1','sfo1'];



export const load = async ({locals}) => {

  const userRegion = locals.region?.split("::")[0];
  let apiURL;
let apiKey = import.meta.env.VITE_STOCKNEAR_API_KEY;


    if (usRegion?.includes(userRegion)) {
        apiURL = import.meta.env.VITE_USEAST_API_URL;
    } else {
        apiURL = import.meta.env.VITE_EU_API_URL;
    };

  const getPoliticianRSS = async () => {
    
    const response = await fetch(apiURL + '/congress-rss-feed', {
      method: 'GET',
      headers: {
        "Content-Type": "application/json", "X-API-KEY": apiKey
      },
    });

    let output = await response.json();

    output = locals?.user?.tier !== 'Pro' ? output?.slice(0,6) : output;

    return output;
  };

  // Make sure to return a promise
  return {
    getPoliticianRSS: await getPoliticianRSS()
  };
};