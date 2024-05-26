import { pb } from "$lib/pocketbase";
import { getCache, setCache } from '$lib/store';


export const load = async ({ params }) => {
  const getArticle = async () => {
    let output;

    // Get cached data for the specific tickerID
    const cachedData = getCache(params?.slug, 'getArticle');
    if (cachedData) {
      output = cachedData;
    } else {

      // make the POST request to the endpoint
      output = await pb?.collection('articles')?.getOne(params?.slug, {expand: 'user'})

      // Cache the data for this specific tickerID with a specific name 'getArticle'
      setCache(params?.slug, output, 'getArticle');
    }

    return output;
  };

  /*
const getDiscordWidget = async () => {
  let output;
  // Get cached data for the specific tickerID
  const cachedData = getCache('', 'getDiscordWidget');
  if (cachedData) {
    output = cachedData;
  } else {

    // make the POST request to the endpoint
    const response = await fetch('https://discord.com/api/guilds/1165618982133436436/widget.json', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    output = await response.json();
    setCache('', output, 'getDiscordWidget');
  }

  return output;
};
*/


  // Make sure to return a promise
  return {
    getArticle: await getArticle(),
    //getDiscordWidget: await getDiscordWidget()
  };
};