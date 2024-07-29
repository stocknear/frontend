import { getCache, setCache } from '$lib/store';


const now = new Date();
const year = now?.getFullYear()?.toString();
const quarter = (Math.floor(now?.getMonth() / 3) + 1)?.toString();

export const load = async ({ parent, params }) => {
  const getTranscripts = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache(`${params.tickerID}-Q-1-2024`, 'getTranscripts');
    if (cachedData) {
      output = cachedData;
    } else {
      const { apiKey, apiURL } = await parent();

      const postData = {
        ticker: params.tickerID,
        quarter: quarter,
        year: year
      };

      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/earnings-call-transcripts', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData)
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getTranscripts'
      setCache(`${params.tickerID}-Q-${quarter}-${year}`, output, 'getTranscripts');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getTranscripts: await getTranscripts(),
    quarter,
    year
  };
};