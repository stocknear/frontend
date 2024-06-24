import {getCache, setCache } from '$lib/store';
import { redirect } from '@sveltejs/kit';


export const load = async ({parent}) => {

  const data = await parent();

  if (data?.user) {
		redirect(303, '/home');
	}


  const getFrontendStars = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getFrontendStars');
    if (cachedData) {
      output = cachedData;
    } else {

      // make the POST request to the endpoint
      const response = await fetch('https://api.github.com/repos/stocknear/frontend', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      output = (await response.json())['stargazers_count'];
      setCache('', output, 'getFrontendStars');
    }
    return output;
  };

  const getBackendStars = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache('', 'getBackendStars');
    if (cachedData) {
      output = cachedData;
    } else {

      // make the POST request to the endpoint
      const response = await fetch('https://api.github.com/repos/stocknear/backend', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      output = (await response.json())['stargazers_count'];
      setCache('', output, 'getBackendStars');
    }
    return output;
  };



  // Make sure to return a promise
  return {
    getFrontendStars: await getFrontendStars(),
    getBackendStars: await getBackendStars(),
  };
};