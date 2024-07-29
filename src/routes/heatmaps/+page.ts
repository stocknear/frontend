import { getCache, setCache } from '$lib/store';




export const load = async ({parent}) => {

  const { apiURL, apiKey} = await parent();
  
  const getSP500HeatMap = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getSP500HeatMap');
    if (cachedData) {
      output = cachedData;
    } else {
        const postData = {'index': 'sp500'};

      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/heatmaps', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData),
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getSP500HeatMap'
      setCache('', output, 'getSP500HeatMap');
    }

    return output;
  };

  const getDowJonesHeatMap = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getDowJonesHeatMap');
    if (cachedData) {
      output = cachedData;
    } else {
        const postData = {'index': 'dowjones'};
      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/heatmaps', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData),
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getDowJonesHeatMap'
      setCache('', output, 'getDowJonesHeatMap');
    }

    return output;
  };

  const getNasdaqHeatMap = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getNasdaqHeatMap');
    if (cachedData) {
      output = cachedData;
    } else {
        const postData = {'index': 'nasdaq'};
      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/heatmaps', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData),
      });

      output = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getNasdaqHeatMap'
      setCache('', output, 'getNasdaqHeatMap');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getSP500HeatMap: await getSP500HeatMap(),
    getDowJonesHeatMap: await getDowJonesHeatMap(),
    getNasdaqHeatMap: await getNasdaqHeatMap(),
  };
};