import { userRegion, getCache, setCache } from '$lib/store';
import { pb } from "$lib/pocketbase";

const usRegion = ['cle1','iad1','pdx1','sfo1'];

let apiURL;

userRegion.subscribe(value => {

  if (usRegion.includes(value)) {
    apiURL = import.meta.env.VITE_USEAST_API_URL;
  } else {
    apiURL = import.meta.env.VITE_EU_API_URL;
  }
});



export const load = async () => {
    const getRecentBlogPost = async () => {
      let output;
  
      // Get cached data for the specific tickerID
      const cachedData = getCache('allBlogPost', 'getRecentBlogPost');
      if (cachedData) {
        output = cachedData;
      } else {
  
        // make the POST request to the endpoint
        output = (await pb.collection('articles').getList(1,4, {sort: '-created'}))?.items;
  
        // Cache the data for this specific tickerID with a specific name 'getRecentBlogPost'
        setCache('allBlogPost', output, 'getRecentBlogPost');
      }
      
      return output;
    };

    const getDailyGainerLoserActive = async () => {
      let output;
  
      // Get cached data for the specific tickerID
      const cachedData = getCache('', 'getDailyGainerLoserActive');
      if (cachedData) {
        output = cachedData;
      } else {
  
        // make the POST request to the endpoint
        const response = await fetch(apiURL + '/market-movers', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        output = await response.json();
  
        setCache('', output, 'getDailyGainerLoserActive');
      }
  
      return output;
    };

    const getMarketNews = async () => {
      let output;
  
      // Get cached data for the specific tickerID
      const cachedData = getCache('', 'getMarketNews');
      if (cachedData) {
        output = cachedData;
      } else {
  
        // make the POST request to the endpoint
        const response = await fetch(apiURL + '/market-news', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        output = await response.json();
  
        // Cache the data for this specific tickerID with a specific name 'getMarketNews'
        setCache('', output, 'getMarketNews');
      }
  
      return output;
    };

    const getPopularETFs = async () => {
      let output;
  
      // Get cached data for the specific tickerID
      const cachedData = getCache('', 'getPopularETFs');
      if (cachedData) {
        output = cachedData;
      } else {
  
        // make the POST request to the endpoint
        const response = await fetch(apiURL + '/popular-etfs', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        output = await response.json();
  
        // Cache the data for this specific tickerID with a specific name 'getPopularETFs'
        setCache('', output, 'getPopularETFs');
      }
  
      return output;
    };
  

    // Make sure to return a promise
    return {
      getRecentBlogPost: await getRecentBlogPost(),
      getDailyGainerLoserActive: await getDailyGainerLoserActive(),
      getMarketNews: await getMarketNews(),
      getPopularETFs: await getPopularETFs(),
    };
  };