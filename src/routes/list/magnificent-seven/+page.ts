import {getCache, setCache } from '$lib/store';



export const load = async ({parent}) => {
  const getMagnificentSeven = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getMagnificentSeven');
    if (cachedData) {
      output = cachedData;
    } else {
      
      const{ apiURL, apiKey} = await parent();

      const response = await fetch(apiURL + '/magnificent-seven', {
        method: 'GET',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
      });

      output = await response.json();

      console.log(output)

      // Cache the data for this specific tickerID with a specific name 'getMagnificentSeven'
      setCache('', output, 'getMagnificentSeven');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getMagnificentSeven: await getMagnificentSeven()
  };
};