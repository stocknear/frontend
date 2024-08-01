import { getCache, setCache } from '$lib/store';
import { redirect } from '@sveltejs/kit';


export const load = async ({parent}) => {

  const { user, apiKey, apiURL } = await parent();


  if (!user) {
		redirect(303, '/');
	}

  const getDashboard = async () => {

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getDashboard');
    if (cachedData) {
      return cachedData;
    } else {

      const response = await fetch(apiURL + '/dashboard-info', {
        method: 'GET',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
      });

      const output = await response?.json();
      setCache('', output, 'getDashboard');
      return output;
    }
  };

  // Make sure to return a promise
  return {
    getDashboard: await getDashboard(),
  };
};