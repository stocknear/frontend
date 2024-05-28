import { getCache, setCache } from '$lib/store';
import defaultAvatar from '$lib/images/hedge_funds/default-avatar.png';



let images = {};
// Function to load images only when they are viewed
async function loadImages() {
  const imageFiles = import.meta.glob('$lib/images/hedge_funds/*.png');
  const imagesPromises = [];

  for (const [path, resolver] of Object?.entries(imageFiles)) {
    const imageNameMatch = path.match(/\/([^/]+)\.png$/);
    if (imageNameMatch && imageNameMatch[1] !== 'default-avatar') {
      imagesPromises?.push(resolver()?.then(module => {
        images[imageNameMatch[1]] = module.default;
      }));
    }
  }

  await Promise.all(imagesPromises);
}



export const load = async () => {
    const getHedgeFunds = async () => {
      let output;
  
      // Get cached data for the specific tickerID
      const cachedData = getCache('getHedgeFunds', 'getHedgeFunds');
      if (cachedData) {
        output = cachedData;
      } else {
        
        output = (await import('$lib/hedge-funds/all-hedge-funds.json'))?.default;
  
        // Cache the data for this specific tickerID with a specific name 'getHedgeFunds'
        setCache('getHedgeFunds', output, 'getHedgeFunds');
      }

      await loadImages();
      output?.forEach(item => {  
        item.image = images[item?.cik] || defaultAvatar;
        });
    
  
      return output;
    };
  
    // Make sure to return a promise
    return {
      getHedgeFunds: await getHedgeFunds()
    };
  };
  