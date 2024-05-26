const usRegion = ['cle1','iad1','pdx1','sfo1'];


export const load = async ({locals}) => {

  const userRegion = locals.region?.split("::")[0];

    let apiURL;

    if (usRegion?.includes(userRegion)) {
        apiURL = import.meta.env.VITE_USEAST_API_URL;
    } else {
        apiURL = import.meta.env.VITE_EU_API_URL;
    };

  const getTopAnalyst = async () => {
      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/top-analysts', {
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
    getTopAnalyst: await getTopAnalyst()
  };
};