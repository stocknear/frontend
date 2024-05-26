const usRegion = ['cle1','iad1','pdx1','sfo1'];



export const load = async ({ params, locals }) => {

  const userRegion = locals.region?.split("::")[0];

    let apiURL;

    if (usRegion?.includes(userRegion)) {
        apiURL = import.meta.env.VITE_USEAST_API_URL;
    } else {
        apiURL = import.meta.env.VITE_EU_API_URL;
    };


  const getAnalystTickerHistory = async () => {
  
    const postData = {
      ticker: params.tickerID
    };

      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/analyst-ticker-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      });

    const output = await response.json();



    return output;
  };

  // Make sure to return a promise
  return {
    getAnalystTickerHistory: await getAnalystTickerHistory()
  };
};
