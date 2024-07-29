import { pb } from "$lib/pocketbase";
import { getCache, setCache } from '$lib/store';


export const load = async ({parent}) => {
  const getAllBlogPost = async () => {
    let output;
    console.log(await parent())
    // Get cached data for the specific tickerID
    const cachedData = getCache('allBlogPost', 'getAllBlogPost');
    if (cachedData) {
      output = cachedData;
    } else {

      // make the POST request to the endpoint
      output = await pb.collection('articles').getFullList({
        expand: 'user',
        sort: '-created'
      })

      // Cache the data for this specific tickerID with a specific name 'getAllBlogPost'
      setCache('allBlogPost', output, 'getAllBlogPost');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getAllBlogPost: await getAllBlogPost()
  };
};