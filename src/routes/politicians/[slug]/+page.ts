import { getCache, setCache } from '$lib/store';
import defaultAvatar from '$lib/images/senator/default-avatar.png';
import { getPartyForPoliticians } from '$lib/utils';


let politicianDistrict;
let politicianCongress;
let politicianParty = 'n/a';
// Function to load images only when they are viewed



export const load = async ({parent, params}) => {
  const getPolitician = async () => {
    let res;

    // Get cached data for the specific tickerID
    const cachedData = getCache(params.slug, 'getPolitician');
    if (cachedData) {
      res = cachedData;
    } else {
      const { apiURL, apiKey} = await parent();

      const postData = {'politicianId': params.slug}
      
      const response = await fetch(apiURL + '/politician-stats', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData)
      });

      const output = await response.json();
      const history = output?.history;
      // Cache the data for this specific tickerID with a specific name 'getPolitician'

      if (output && history?.length > 0) {
          let firstItem = history?.at(0);
          let representative = firstItem?.representative || '';
      
          representative = representative?.replace('Jr', '')
              ?.replace(/Dr./g, '')
              ?.replace(/Dr_/g, '');
      
          const fullName = representative?.replace(/(\s(?:Dr\s)?\w(?:\.|(?=\s)))?\s/g, '_')?.trim();
          firstItem.representative = fullName?.replace(/_/g, ' ');
      
          const party = getPartyForPoliticians(firstItem?.representative);
          firstItem.party = party;
      
          politicianParty = firstItem?.party;
          politicianDistrict = firstItem?.district;
          politicianCongress = firstItem?.congress;
      }

      res = {output, politicianParty, politicianDistrict, politicianCongress};
      setCache(params.slug, res, 'getPolitician');
    }

    return res
  };

  // Make sure to return a promise
  return {
    getPolitician: await getPolitician()
  };
};