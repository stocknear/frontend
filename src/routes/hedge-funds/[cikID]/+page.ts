import { userRegion, displayCompanyName, getCache, setCache } from '$lib/store';

const usRegion = ['cle1','iad1','pdx1','sfo1'];

  let apiURL;

  userRegion?.subscribe(value => {
    if (usRegion?.includes(value)) {
      apiURL = import.meta.env.VITE_USEAST_API_URL;
    } else {
      apiURL = import.meta.env.VITE_EU_API_URL;
    }
  });


export const load = async ({ params }) => {

  const getCIKData = async () => {
    return params.cikID;
  }

  const getHedgeFundsData = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache(params.cikID, 'getHedgeFundsData');
    if (cachedData) {
      output = cachedData;
    } 
    else {

    
      const postData = {
        cik: params.cikID
      };

        // make the POST request to the endpoint
        const response = await fetch(apiURL + '/cik-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData)
        });

        output = await response.json();

        // Cache the data for this specific tickerID with a specific name 'getHedgeFundsData'
        setCache(params.cikID, output, 'getHedgeFundsData');
      }
      
    try {
      output[0].holdings = output?.at(0)?.holdings?.filter(item => item?.sharesNumber !== 0 && item?.symbol !== null); //item?.symbol !== null
    } catch(e) {
      console.log(e)
    }
  
    displayCompanyName.update(value => output[0]?.name ?? params.cikID)
    return output;
  };

  // Make sure to return a promise
  return {
    getCIKData: await getCIKData(),
    getHedgeFundsData: await getHedgeFundsData()
  };
};