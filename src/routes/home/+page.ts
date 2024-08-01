import { getCache, setCache } from '$lib/store';
import { redirect } from '@sveltejs/kit';


export const load = async ({ parent}) => {

  const { user, apiKey, apiURL } = await parent();

  if (!user) {
		redirect(303, '/');
	}


  const getDashboard = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getDashboard');
    if (cachedData) {
      output = cachedData;
    } else {

      const response = await fetch(apiURL + '/dashboard-info', {
        method: 'GET',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
      });

      output = await response.json();
      setCache('', output, 'getDashboard');
    }
    return output;
  };

  // Make sure to return a promise
  return {
    getDashboard: await getDashboard(),
  };
};