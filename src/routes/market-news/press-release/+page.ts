import { getCache, setCache } from '$lib/store';



export const load = async ({parent}) => {
  const getPressRelease = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getPressRelease');
    if (cachedData) {
      output = cachedData;
    } else {
      const { apiURL, apiKey } = await parent();
      const postData = {'newsType': 'press-releases'}

      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/market-news', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData)
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getPressRelease'
      setCache('', output, 'getPressRelease');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getPressRelease: await getPressRelease()
  };
};