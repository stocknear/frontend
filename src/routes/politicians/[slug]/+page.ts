import { userRegion, getCache, setCache } from '$lib/store';
import defaultAvatar from '$lib/images/senator/default-avatar.png';
import { getPartyForPoliticians } from '$lib/utils';

const usRegion = ['cle1','iad1','pdx1','sfo1'];

let apiURL;
let images = {};
let politicianImage;
let politicianDistrict;
let politicianCongress;
let politicianParty = 'n/a';

userRegion.subscribe(value => {

  if (usRegion?.includes(value)) {
    apiURL = import.meta.env.VITE_USEAST_API_URL;
  } else {
    apiURL = import.meta.env.VITE_EU_API_URL;
  }
});


// Function to load images only when they are viewed
  async function loadImages() {
    const imageFiles = import.meta.glob('$lib/images/senator/*.png');
    const imagesPromises = [];

    for (const [path, resolver] of Object?.entries(imageFiles)) {
      const imageNameMatch = path.match(/\/([^/]+)\.png$/);
      if (imageNameMatch && imageNameMatch[1] !== 'default-avatar') {
        imagesPromises?.push(resolver()?.then(module => {
          images[imageNameMatch[1]] = module.default;
        }));
      }
    }

    await Promise?.all(imagesPromises);
  }


export const load = async ({params}) => {
  const getPolitician = async () => {
    let res;

    // Get cached data for the specific tickerID
    const cachedData = getCache(params.slug, 'getPolitician');
    if (cachedData) {
      res = cachedData;
    } else {

        const postData = {'politicianId': params.slug}
      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/politician-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      });

      const output = await response.json();
      await loadImages();

      // Cache the data for this specific tickerID with a specific name 'getPolitician'

      if (output && output.length > 0) {
          let firstItem = output?.at(0);
          let representative = firstItem?.representative || '';
      
          representative = representative?.replace('Jr', '')
              ?.replace(/Dr./g, '')
              ?.replace(/Dr_/g, '');
      
          const fullName = representative?.replace(/(\s(?:Dr\s)?\w(?:\.|(?=\s)))?\s/g, '_')?.trim();
          firstItem.image = images[fullName] || defaultAvatar;
          firstItem.representative = fullName?.replace(/_/g, ' ');
      
          const party = getPartyForPoliticians(firstItem?.representative);
          firstItem.party = party;
      
          politicianImage = firstItem?.image;
          politicianParty = firstItem?.party;
          politicianDistrict = firstItem?.district;
          politicianCongress = firstItem?.congress;
      }

      res = {output, politicianImage, politicianParty, politicianDistrict, politicianCongress};
      setCache(params.slug, res, 'getPolitician');
    }

    return res
  };

  // Make sure to return a promise
  return {
    getPolitician: await getPolitician()
  };
};